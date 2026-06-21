"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PokemonInstance } from "@prisma/client";
import { Swords, Trophy, RotateCcw, Zap, TrendingUp } from "lucide-react";
import { getSpriteUrl, getBattlePlayerSprite, getBattleEnemySprite, getPokemonName } from "@/lib/pokemon-names";

// ─── Types ─────────────────────────────────────────────────────────────────

interface TurnLogEntry {
  actor: "player" | "enemy" | "system";
  text: string;
}

interface PlayerState {
  pokemonId: string;
  pokedexNumber: number;
  level: number;
  experience: number;
  xpForNext: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
}

interface EnemyState {
  pokedexNumber: number;
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
}

interface Move {
  id: string;
  name: string;
  power: number;
}

interface BattleState {
  sessionId: string;
  player: PlayerState;
  enemy: EnemyState;
  moves: Move[];
  battlesRemainingToday: number;
}

interface ResultState {
  won: boolean;
  reward: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  pokemonName: string;
}

type Screen = "select" | "battle" | "result";

interface Props {
  pokemons: PokemonInstance[];
  userId: string;
  pokemonedas: number;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.round((current / max) * 100));
  const color = pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function XpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
      <div className="h-full bg-sky-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function LogLine({ entry }: { entry: TurnLogEntry }) {
  const color =
    entry.actor === "player" ? "text-emerald-400" :
    entry.actor === "enemy"  ? "text-red-400" :
    "text-amber-400";
  return <p className={`text-xs leading-snug ${color}`}>{entry.text}</p>;
}

// ─── Screen: Selección ─────────────────────────────────────────────────────

function SelectScreen({
  pokemons,
  battlesRemainingToday,
  onSelect,
  loading,
}: {
  pokemons: PokemonInstance[];
  battlesRemainingToday: number;
  onSelect: (pokemonId: string) => void;
  loading: string | null;
}) {
  if (pokemons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Swords size={40} className="text-slate-600" />
        <p className="text-slate-400 text-sm">
          No tienes Pokémon en tu colección. Consigue huevos para empezar a combatir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-snow flex items-center gap-2">
            <Swords size={20} className="text-red-400" />
            Arena de Batallas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Elige un Pokémon para combatir. Ganar batallas otorga XP y sube de nivel.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full whitespace-nowrap">
          <Zap size={12} className="text-amber-400" />
          {battlesRemainingToday} batallas restantes hoy
        </div>
      </div>

      {battlesRemainingToday === 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
          Has alcanzado el límite diario de 5 batallas. Vuelve mañana.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {pokemons.map((p) => {
          const raw = p.stats as { hp?: number; attack?: number; defense?: number } | null;
          const name = getPokemonName(p.pokedexNumber);
          const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");
          const isLoading = loading === p.id;
          const xpPct = p.level < 50 ? Math.min(100, Math.round((p.experience / (p.level * 50)) * 100)) : 100;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              disabled={battlesRemainingToday === 0 || loading !== null}
              className="flex flex-col items-center gap-2 bg-graphite-700/40 border border-white/8 rounded-2xl p-3 hover:border-red-400/40 hover:bg-graphite-700/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group text-left"
            >
              <div className="relative w-full flex justify-center">
                <img
                  src={getSpriteUrl(p.pokedexNumber)}
                  alt={displayName}
                  className="w-16 h-16 object-contain pixelated group-hover:scale-110 transition-transform duration-200"
                />
                <span className="absolute top-0 right-0 text-[9px] font-black bg-slate-800 border border-white/10 text-slate-300 px-1.5 py-0.5 rounded-full">
                  Nv.{p.level}
                </span>
              </div>

              <span className="text-xs font-bold text-snow truncate w-full text-center">
                {displayName}
              </span>

              {/* XP bar */}
              <div className="w-full flex flex-col gap-1">
                <XpBar current={p.experience} max={p.level * 50} />
                <span className="text-[9px] text-slate-600 text-center">{xpPct}% XP</span>
              </div>

              <div className="text-[10px] text-slate-500 grid grid-cols-3 gap-1 w-full text-center">
                <span>HP {raw?.hp ?? 0}</span>
                <span>ATK {raw?.attack ?? 0}</span>
                <span>DEF {raw?.defense ?? 0}</span>
              </div>

              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
                {isLoading ? "Cargando..." : "Combatir"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screen: Combate ───────────────────────────────────────────────────────

function BattleScreen({
  battle,
  onTurn,
  onForfeit,
  loading,
  turnLog,
}: {
  battle: BattleState;
  onTurn: (moveId: string) => void;
  onForfeit: () => void;
  loading: boolean;
  turnLog: TurnLogEntry[];
}) {
  const playerRaw = getPokemonName(battle.player.pokedexNumber);
  const playerDisplay = playerRaw.charAt(0).toUpperCase() + playerRaw.slice(1).replace(/-/g, " ");
  const enemyDisplay  = battle.enemy.name.charAt(0).toUpperCase() + battle.enemy.name.slice(1).replace(/-/g, " ");

  return (
    <div className="flex flex-col gap-4">
      {/* Arena */}
      <div className="grid grid-cols-2 gap-4">
        {/* Jugador — sprite desde atrás */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 self-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tu Pokémon</span>
            <span className="text-[9px] font-black bg-slate-800 border border-white/10 text-slate-300 px-1.5 py-0.5 rounded-full">Nv.{battle.player.level}</span>
          </div>
          <img
            src={getBattlePlayerSprite(battle.player.pokedexNumber)}
            alt={playerDisplay}
            className="w-28 h-28 object-contain pixelated"
          />
          <span className="text-sm font-bold text-snow">{playerDisplay}</span>
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>HP</span>
              <span>{battle.player.currentHp} / {battle.player.maxHp}</span>
            </div>
            <HpBar current={battle.player.currentHp} max={battle.player.maxHp} />
          </div>
        </div>

        {/* Enemigo — sprite de frente */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 self-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rival</span>
            <span className="text-[9px] font-black bg-slate-800 border border-white/10 text-slate-300 px-1.5 py-0.5 rounded-full">Nv.{battle.enemy.level}</span>
          </div>
          <img
            src={getBattleEnemySprite(battle.enemy.pokedexNumber)}
            alt={enemyDisplay}
            className="w-28 h-28 object-contain pixelated"
          />
          <span className="text-sm font-bold text-snow">{enemyDisplay}</span>
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>HP</span>
              <span>{battle.enemy.currentHp} / {battle.enemy.maxHp}</span>
            </div>
            <HpBar current={battle.enemy.currentHp} max={battle.enemy.maxHp} />
          </div>
        </div>
      </div>

      {/* Log de turnos */}
      {turnLog.length > 0 && (
        <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5 min-h-[60px]">
          {turnLog.slice(-5).map((entry, i) => (
            <LogLine key={i} entry={entry} />
          ))}
        </div>
      )}

      {/* Movimientos */}
      <div className="grid grid-cols-2 gap-2">
        {battle.moves.map((move) => (
          <button
            key={move.id}
            onClick={() => onTurn(move.id)}
            disabled={loading}
            className="flex flex-col items-start gap-0.5 bg-graphite-700/40 border border-white/8 rounded-xl px-4 py-3 hover:border-red-400/40 hover:bg-graphite-700/70 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <span className="text-sm font-bold text-snow">{move.name}</span>
            <span className="text-[10px] text-slate-500 font-semibold">Potencia {move.power}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onForfeit}
        disabled={loading}
        className="self-start text-xs text-slate-600 hover:text-slate-400 underline underline-offset-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        Rendirse (sin penalización)
      </button>
    </div>
  );
}

// ─── Screen: Resultado ─────────────────────────────────────────────────────

function ResultScreen({ result, onBack }: { result: ResultState; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${
        result.won ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800 border-white/10"
      }`}>
        {result.won
          ? <Trophy size={36} className="text-amber-400" />
          : <Swords size={36} className="text-slate-500" />
        }
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-snow uppercase tracking-wider">
          {result.won ? "¡Victoria!" : "Derrota"}
        </h2>
        <p className="text-sm text-slate-400">
          {result.won
            ? `¡Bien hecho, Entrenador! ${result.pokemonName} ganó la batalla.`
            : `${result.pokemonName} fue derrotado. ¡Entrena más y vuelve a intentarlo!`
          }
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {result.won && result.reward > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-6 py-3 flex items-center gap-3">
            <Zap size={16} className="text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">+{result.reward.toLocaleString("es-ES")} Pokémonedas</span>
          </div>
        )}

        {result.xpGained > 0 && (
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-6 py-3 flex items-center gap-3">
            <TrendingUp size={16} className="text-sky-400" />
            <span className="text-sky-400 font-bold text-sm">+{result.xpGained} XP para {result.pokemonName}</span>
          </div>
        )}

        {result.leveledUp && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-6 py-3 text-center">
            <p className="text-purple-300 font-black text-base">¡{result.pokemonName} subió al nivel {result.newLevel}!</p>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 text-snow text-sm font-semibold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
      >
        <RotateCcw size={14} />
        Volver a la selección
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function Battles({ pokemons, userId, pokemonedas }: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("select");
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [selectLoading, setSelectLoading] = useState<string | null>(null);
  const [turnLoading, setTurnLoading] = useState(false);
  const [turnLog, setTurnLog] = useState<TurnLogEntry[]>([]);
  const [result, setResult] = useState<ResultState | null>(null);
  const [battlesRemainingToday, setBattlesRemainingToday] = useState(5);

  async function handleSelectPokemon(pokemonId: string) {
    setSelectLoading(pokemonId);
    try {
      const res = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemonId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Error al iniciar la batalla");
        return;
      }

      setBattle({
        sessionId: data.battleSessionId,
        player: data.player,
        enemy: data.enemy,
        moves: data.moves,
        battlesRemainingToday: data.battlesRemainingToday,
      });
      setBattlesRemainingToday(data.battlesRemainingToday);
      setTurnLog([]);
      setScreen("battle");
    } finally {
      setSelectLoading(null);
    }
  }

  async function handleTurn(moveId: string) {
    if (!battle) return;
    setTurnLoading(true);
    try {
      const res = await fetch("/api/battle/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battleSessionId: battle.sessionId, moveId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Error en el turno");
        return;
      }

      setBattle((prev) =>
        prev
          ? {
              ...prev,
              player: { ...prev.player, currentHp: data.playerCurrentHp },
              enemy: { ...prev.enemy, currentHp: data.enemyCurrentHp },
            }
          : prev
      );
      setTurnLog((prev) => [...prev, ...(data.lastTurnLog ?? [])]);

      if (data.status === "PLAYER_WON") {
        const rawName = getPokemonName(battle.player.pokedexNumber);
        const pokemonName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/-/g, " ");
        setResult({
          won: true,
          reward: data.reward,
          xpGained: data.xpGained ?? 0,
          leveledUp: data.leveledUp ?? false,
          newLevel: data.newLevel ?? battle.player.level,
          pokemonName,
        });
        setScreen("result");
        router.refresh();
      } else if (data.status === "ENEMY_WON") {
        const rawName = getPokemonName(battle.player.pokedexNumber);
        const pokemonName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/-/g, " ");
        setResult({ won: false, reward: 0, xpGained: 0, leveledUp: false, newLevel: battle.player.level, pokemonName });
        setScreen("result");
      }
    } finally {
      setTurnLoading(false);
    }
  }

  async function handleForfeit() {
    if (!battle) return;
    await fetch("/api/battle/forfeit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battleSessionId: battle.sessionId }),
    });
    setBattle(null);
    setTurnLog([]);
    setScreen("select");
  }

  function handleBackToSelect() {
    setBattle(null);
    setTurnLog([]);
    setResult(null);
    setScreen("select");
  }

  return (
    <>
      {screen === "select" && (
        <SelectScreen
          pokemons={pokemons}
          battlesRemainingToday={battlesRemainingToday}
          onSelect={handleSelectPokemon}
          loading={selectLoading}
        />
      )}
      {screen === "battle" && battle && (
        <BattleScreen
          battle={battle}
          onTurn={handleTurn}
          onForfeit={handleForfeit}
          loading={turnLoading}
          turnLog={turnLog}
        />
      )}
      {screen === "result" && result && (
        <ResultScreen result={result} onBack={handleBackToSelect} />
      )}
    </>
  );
}
