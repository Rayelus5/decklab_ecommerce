import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcMaxHp, calcEffectiveStat, generateEnemy, BATTLE_MOVES, xpForNextLevel, MAX_LEVEL } from "@/lib/battle-engine";

const bodySchema = z.object({
  pokemonId: z.string().min(1),
});

const DAILY_BATTLE_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "pokemonId requerido" }, { status: 400 });
    }
    const { pokemonId } = parsed.data;

    // Comprobar límite diario
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.battleSession.count({
      where: {
        userId,
        createdAt: { gte: startOfToday },
        status: { not: "ABANDONED" },
      },
    });

    if (todaySessions >= DAILY_BATTLE_LIMIT) {
      return NextResponse.json(
        { error: `Límite diario alcanzado (${DAILY_BATTLE_LIMIT} batallas/día).` },
        { status: 429 }
      );
    }

    // Verificar que el Pokémon pertenece al usuario
    const pokemon = await prisma.pokemonInstance.findUnique({
      where: { id: pokemonId },
    });

    if (!pokemon || pokemon.userId !== userId) {
      return NextResponse.json({ error: "Pokémon no válido" }, { status: 404 });
    }

    const rawStats = pokemon.stats as { hp?: number; attack?: number; defense?: number } | null;
    const playerHpIv  = rawStats?.hp      ?? 0;
    const playerAtkIv = rawStats?.attack  ?? 10;
    const playerDefIv = rawStats?.defense ?? 10;
    const playerLevel = pokemon.level;

    const effectiveAtk = calcEffectiveStat(playerAtkIv, playerLevel);
    const effectiveDef = calcEffectiveStat(playerDefIv, playerLevel);
    const playerMaxHp  = calcMaxHp(playerHpIv, playerLevel);

    // Generar enemigo con nivel comparable
    const enemy = generateEnemy(playerHpIv, playerAtkIv, playerDefIv, playerLevel);

    // Crear sesión
    const battleSession = await prisma.battleSession.create({
      data: {
        userId,
        playerPokemonId: pokemonId,
        playerCurrentHp: playerMaxHp,
        enemyData: {
          pokedexNumber: enemy.pokedexNumber,
          name: enemy.name,
          level: enemy.level,
          maxHp: enemy.maxHp,
          attack: enemy.attack,
          defense: enemy.defense,
        },
        enemyCurrentHp: enemy.maxHp,
        turnLog: [],
      },
    });

    return NextResponse.json({
      battleSessionId: battleSession.id,
      player: {
        pokemonId,
        pokedexNumber: pokemon.pokedexNumber,
        level: playerLevel,
        experience: pokemon.experience,
        xpForNext: xpForNextLevel(playerLevel),
        maxHp: playerMaxHp,
        currentHp: playerMaxHp,
        attack: effectiveAtk,
        defense: effectiveDef,
      },
      enemy: {
        ...enemy,
        currentHp: enemy.maxHp,
      },
      moves: BATTLE_MOVES,
      battlesUsedToday: todaySessions + 1,
      battlesRemainingToday: DAILY_BATTLE_LIMIT - todaySessions - 1,
    });
  } catch (err) {
    console.error("[BATTLE START]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
