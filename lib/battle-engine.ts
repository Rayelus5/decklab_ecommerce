import { getPokemonName } from "@/lib/pokemon-names";

export interface EnemyData {
  pokedexNumber: number;
  name: string;
  level: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export const BATTLE_MOVES = [
  { id: "tackle",    name: "Placaje",  power: 40 },
  { id: "headbutt",  name: "Cabezazo", power: 60 },
  { id: "slam",      name: "Golpe",    power: 80 },
  { id: "megapunch", name: "Megapuño", power: 100 },
] as const;

export type MoveId = (typeof BATTLE_MOVES)[number]["id"];

export const MAX_LEVEL = 50;
export const BASE_XP_PER_LEVEL = 50;

export function xpForNextLevel(level: number): number {
  return level * BASE_XP_PER_LEVEL;
}

// HP escala con IV y nivel: nivel 1 → 158-460, nivel 50 → 558-860
export function calcMaxHp(hpIv: number, level: number = 1): number {
  return 150 + Math.max(0, Math.min(31, hpIv)) * 10 + level * 8;
}

// Stat efectivo: IV + bonus de nivel
export function calcEffectiveStat(iv: number, level: number): number {
  return Math.max(5, iv + Math.floor(level * 0.8));
}

// Daño escalado para batallas de 6-10 turnos
export function calcDamage(power: number, attack: number, defense: number): number {
  const base = (power * (attack + 5)) / (defense + 5);
  const rng = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(base * 0.45 * rng));
}

// Genera un enemigo con nivel e IVs comparables al jugador
export function generateEnemy(
  playerHpIv: number,
  playerAtk: number,
  playerDef: number,
  playerLevel: number
): EnemyData {
  const num = Math.floor(Math.random() * 151) + 1;
  const name = getPokemonName(num);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const spread = () => Math.floor((Math.random() - 0.5) * 20);

  const level = clamp(playerLevel + Math.floor((Math.random() - 0.5) * 6), 1, MAX_LEVEL);
  const hpIv   = clamp(playerHpIv + spread(), 0, 31);
  const atkIv  = clamp(playerAtk  + spread(), 0, 31);
  const defIv  = clamp(playerDef  + spread(), 0, 31);

  return {
    pokedexNumber: num,
    name,
    level,
    maxHp:   calcMaxHp(hpIv, level),
    attack:  calcEffectiveStat(atkIv, level),
    defense: calcEffectiveStat(defIv, level),
  };
}
