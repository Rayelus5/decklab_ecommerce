"use client";

import { PokemonInstance } from "@prisma/client";
import { POKEMON_NAMES, getSpriteUrl } from "@/lib/pokemon-names";

interface Props {
  pokemons: PokemonInstance[];
}

export function Pokedex({ pokemons }: Props) {
  // Número único de cada Pokémon que el usuario posee
  const owned = new Set(pokemons.map((p) => p.pokedexNumber));
  // Cuántos de cada uno tiene (para mostrar duplicados)
  const countMap = new Map<number, number>();
  for (const p of pokemons) {
    countMap.set(p.pokedexNumber, (countMap.get(p.pokedexNumber) ?? 0) + 1);
  }

  const uniqueCount = owned.size;
  const pct = Math.round((uniqueCount / 151) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera con progreso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-snow">Pokédex</h2>
          <p className="text-sm text-slate-400 mt-1">
            Colecciona los 151 Pokémon de la Generación I.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 min-w-[160px]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-snow tabular-nums">{uniqueCount}</span>
            <span className="text-slate-400 text-sm font-medium">/ 151</span>
          </div>
          <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">{pct}% completado</span>
        </div>
      </div>

      {/* Grid de 151 Pokémon */}
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1.5">
        {Array.from({ length: 151 }, (_, i) => {
          const num = i + 1;
          const isOwned = owned.has(num);
          const count = countMap.get(num) ?? 0;
          const name = POKEMON_NAMES[i];
          const spriteUrl = getSpriteUrl(num);
          const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " ");

          return (
            <div
              key={num}
              title={isOwned ? `${displayName} ×${count}` : `#${String(num).padStart(3, "0")} ???`}
              className={`
                relative aspect-square rounded-xl border flex flex-col items-center justify-center
                transition-all duration-150 overflow-hidden
                ${isOwned
                  ? "bg-graphite-700/60 border-white/12 hover:border-amber-400/40 hover:bg-graphite-700/80 cursor-default"
                  : "bg-black/30 border-white/5 cursor-default"
                }
              `}
            >
              <img
                src={spriteUrl}
                alt={isOwned ? displayName : "???"}
                className={`w-[80%] h-[80%] object-contain transition-all duration-300 pixelated ${
                  isOwned ? "opacity-100" : "opacity-15 grayscale"
                }`}
              />
              <span className={`text-[8px] font-bold tabular-nums absolute bottom-0.5 ${
                isOwned ? "text-slate-400" : "text-white/15"
              }`}>
                {String(num).padStart(3, "0")}
              </span>

              {/* Badge de cantidad si tiene más de 1 */}
              {count > 1 && (
                <div className="absolute top-0.5 right-0.5 bg-amber-500 text-black text-[7px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                  {count}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {uniqueCount === 0 && (
        <p className="text-center text-sm text-slate-500 py-8">
          Todavía no tienes Pokémon. ¡Canjea un código o compra un Huevo Misterioso para empezar!
        </p>
      )}
    </div>
  );
}
