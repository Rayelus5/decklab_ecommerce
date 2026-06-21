import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { calcDamage, calcEffectiveStat, calcMaxHp, BATTLE_MOVES, xpForNextLevel, MAX_LEVEL } from "@/lib/battle-engine";
import { getPokemonName } from "@/lib/pokemon-names";

const bodySchema = z.object({
  battleSessionId: z.string().min(1),
  moveId: z.enum(["tackle", "headbutt", "slam", "megapunch"]),
});

interface EnemyData {
  pokedexNumber: number;
  name: string;
  level: number;
  maxHp: number;
  attack: number;
  defense: number;
}

interface TurnLogEntry {
  actor: "player" | "enemy" | "system";
  text: string;
}

const PLAYER_ATTACK_MSGS = [
  (a: string, m: string, d: number, b: string) => `¡${a} lanzó ${m} contra ${b} — ${d} de daño!`,
  (a: string, m: string, d: number, b: string) => `¡${a} usó ${m}! ${b} recibió ${d} de daño.`,
  (a: string, m: string, d: number, _b: string) => `¡${a} atacó con ${m} con fuerza — ${d} de daño!`,
];

const ENEMY_ATTACK_MSGS = [
  (a: string, m: string, d: number, b: string) => `¡${a} contraatacó con ${m} — ${d} de daño a ${b}!`,
  (a: string, m: string, d: number, b: string) => `${a} usó ${m} y golpeó a ${b} por ${d} de daño.`,
  (a: string, m: string, d: number, b: string) => `¡${a} respondió con ${m}! ${b} recibió ${d} de daño.`,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calcReward(enemyLevel: number, enemyRemainingHpRatio: number): number {
  const base = 80 + enemyLevel * 4;
  return Math.round(base + enemyRemainingHpRatio * 120);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { battleSessionId, moveId } = parsed.data;

    // Cargar sesión
    const battleSession = await prisma.battleSession.findUnique({
      where: { id: battleSessionId },
      include: {
        playerPokemon: { select: { id: true, stats: true, pokedexNumber: true, level: true, experience: true } },
      },
    });

    if (!battleSession || battleSession.userId !== userId) {
      return NextResponse.json({ error: "Sesión de batalla no encontrada" }, { status: 404 });
    }

    if (battleSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "La batalla ya ha terminado" }, { status: 400 });
    }

    const enemy = battleSession.enemyData as unknown as EnemyData;
    const rawStats = battleSession.playerPokemon.stats as { hp?: number; attack?: number; defense?: number } | null;
    const playerLevel = battleSession.playerPokemon.level;
    const playerAtk   = calcEffectiveStat(rawStats?.attack  ?? 10, playerLevel);
    const playerDef   = calcEffectiveStat(rawStats?.defense ?? 10, playerLevel);
    const playerMaxHp = calcMaxHp(rawStats?.hp ?? 0, playerLevel);

    const playerRawName = getPokemonName(battleSession.playerPokemon.pokedexNumber);
    const playerName    = playerRawName.charAt(0).toUpperCase() + playerRawName.slice(1).replace(/-/g, " ");
    const enemyName     = enemy.name.charAt(0).toUpperCase() + enemy.name.slice(1).replace(/-/g, " ");

    const move = BATTLE_MOVES.find((m) => m.id === moveId)!;

    // Compatibilidad: convertir logs string[] legacy a TurnLogEntry[]
    const rawLog = battleSession.turnLog;
    const turnLog: TurnLogEntry[] = Array.isArray(rawLog)
      ? rawLog.map((e) =>
          typeof e === "string"
            ? { actor: "system" as const, text: e }
            : (e as unknown as TurnLogEntry)
        )
      : [];

    // 1. Turno del jugador
    const playerDmg  = calcDamage(move.power, playerAtk, enemy.defense);
    let newEnemyHp   = Math.max(0, battleSession.enemyCurrentHp - playerDmg);
    turnLog.push({ actor: "player", text: pick(PLAYER_ATTACK_MSGS)(playerName, move.name, playerDmg, enemyName) });

    let newStatus: "ACTIVE" | "PLAYER_WON" | "ENEMY_WON" = "ACTIVE";
    let newPlayerHp = battleSession.playerCurrentHp;
    let reward      = 0;
    let xpGained    = 0;
    let leveledUp   = false;
    let newLevel    = playerLevel;

    if (newEnemyHp <= 0) {
      newStatus = "PLAYER_WON";
      turnLog.push({ actor: "system", text: `¡${playerName} derrotó a ${enemyName}! ¡Victoria!` });
      reward = calcReward(enemy.level, battleSession.enemyCurrentHp / enemy.maxHp);

      // Calcular XP ganada
      xpGained = 30 + enemy.level * 5;
      let newXp = battleSession.playerPokemon.experience + xpGained;
      newLevel = playerLevel;
      while (newLevel < MAX_LEVEL && newXp >= xpForNextLevel(newLevel)) {
        newXp -= xpForNextLevel(newLevel);
        newLevel++;
        leveledUp = true;
      }

      if (leveledUp) {
        turnLog.push({ actor: "system", text: `¡${playerName} subió al nivel ${newLevel}!` });
      }

      await prisma.$transaction(async (tx) => {
        await tx.battleSession.update({
          where: { id: battleSessionId },
          data: { status: newStatus, playerCurrentHp: newPlayerHp, enemyCurrentHp: newEnemyHp, turnLog: turnLog as unknown as Prisma.InputJsonValue, rewardClaimed: true },
        });
        await tx.pokemonInstance.update({
          where: { id: battleSession.playerPokemon.id },
          data: { experience: newXp, level: newLevel },
        });
        await tx.user.update({
          where: { id: userId },
          data: { pokemonedas: { increment: reward } },
        });
      });
    } else {
      // 2. Turno del enemigo — usa Megapuño (IA agresiva)
      const enemyMove = BATTLE_MOVES[3];
      const enemyDmg  = calcDamage(enemyMove.power, enemy.attack, playerDef);
      newPlayerHp     = Math.max(0, battleSession.playerCurrentHp - enemyDmg);
      turnLog.push({ actor: "enemy", text: pick(ENEMY_ATTACK_MSGS)(enemyName, enemyMove.name, enemyDmg, playerName) });

      if (newPlayerHp <= 0) {
        newStatus = "ENEMY_WON";
        turnLog.push({ actor: "system", text: `¡${playerName} fue derrotado por ${enemyName}!` });
      } else if (newPlayerHp <= playerMaxHp * 0.25) {
        turnLog.push({ actor: "system", text: `¡Atención! ${playerName} tiene muy poca vida.` });
      }

      await prisma.battleSession.update({
        where: { id: battleSessionId },
        data: { status: newStatus, playerCurrentHp: newPlayerHp, enemyCurrentHp: newEnemyHp, turnLog: turnLog as unknown as Prisma.InputJsonValue },
      });
    }

    return NextResponse.json({
      status: newStatus,
      playerCurrentHp: newPlayerHp,
      enemyCurrentHp: newEnemyHp,
      lastTurnLog: turnLog.slice(-4),
      reward: newStatus === "PLAYER_WON" ? reward : 0,
      xpGained,
      leveledUp,
      newLevel,
    });
  } catch (err) {
    console.error("[BATTLE TURN]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
