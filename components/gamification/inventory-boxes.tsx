"use client";

import { useState } from "react";
import { PokemonInstance } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Lista estática de los 151 Pokémon originales (Gen 1)
const POKEMON_NAMES = [
  "bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard",
  "squirtle", "wartortle", "blastoise", "caterpie", "metapod", "butterfree",
  "weedle", "kakuna", "beedrill", "pidgey", "pidgeotto", "pidgeot", "rattata", "raticate",
  "spearow", "fearow", "ekans", "arbok", "pikachu", "raichu", "sandshrew", "sandslash",
  "nidoran-f", "nidorina", "nidoqueen", "nidoran-m", "nidorino", "nidoking", "clefairy", "clefable",
  "vulpix", "ninetales", "jigglypuff", "wigglytuff", "zubat", "golbat", "oddish", "gloom", "vileplume",
  "paras", "parasect", "venonat", "venomoth", "diglett", "dugtrio", "meowth", "persian",
  "psyduck", "golduck", "mankey", "primeape", "growlithe", "arcanine", "poliwag", "poliwhirl", "poliwrath",
  "abra", "kadabra", "alakazam", "machop", "machoke", "machamp", "bellsprout", "weepinbell", "victreebel",
  "tentacool", "tentacruel", "geodude", "graveler", "golem", "ponyta", "rapidash", "slowpoke", "slowbro",
  "magnemite", "magneton", "farfetchd", "doduo", "dodrio", "seel", "dewgong", "grimer", "muk",
  "shellder", "cloyster", "gastly", "haunter", "gengar", "onix", "drowzee", "hypno", "krabby", "kingler",
  "voltorb", "electrode", "exeggcute", "exeggutor", "cubone", "marowak", "hitmonlee", "hitmonchan", "lickitung",
  "koffing", "weezing", "rhyhorn", "rhydon", "chansey", "tangela", "kangaskhan", "horsea", "seadra",
  "goldeen", "seaking", "staryu", "starmie", "mr-mime", "scyther", "jynx", "electabuzz", "magmar", "pinsir",
  "tauros", "magikarp", "gyarados", "lapras", "ditto", "eevee", "vaporeon", "jolteon", "flareon", "porygon",
  "omanyte", "omastar", "kabuto", "kabutops", "aerodactyl", "snorlax", "articuno", "zapdos", "moltres",
  "dratini", "dragonair", "dragonite", "mewtwo", "mew"
];

interface Props {
  pokemons: PokemonInstance[];
  boxesUnlocked: number;
}

export function InventoryBoxes({ pokemons, boxesUnlocked }: Props) {
  const [currentBox, setCurrentBox] = useState(1);

  const prevBox = () => setCurrentBox((prev) => Math.max(1, prev - 1));
  const nextBox = () => setCurrentBox((prev) => Math.min(boxesUnlocked, prev + 1));

  // Obtener los pokémons de la caja actual
  const boxPokemons = pokemons.filter((p) => p.boxNumber === currentBox);

  // Crear una matriz de 30 slots
  const slots = Array.from({ length: 30 }, (_, i) => {
    const slotNum = i + 1;
    const pokemon = boxPokemons.find((p) => p.slotNumber === slotNum);
    return { slotNum, pokemon };
  });

  const getSpriteUrl = (pokedexNumber: number) => {
    const name = POKEMON_NAMES[pokedexNumber - 1];
    if (!name) return "";
    return `https://img.pokemondb.net/sprites/lets-go-pikachu-eevee/normal/${name}.png`;
  };

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col gap-6">
      {/* Box Header Controls */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2">
        <button
          onClick={prevBox}
          disabled={currentBox === 1}
          className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-snow">CAJA {currentBox}</h2>
        <button
          onClick={nextBox}
          disabled={currentBox === boxesUnlocked}
          className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
        >
          <ChevronRight className="text-white" />
        </button>
      </div>

      {/* Grid de 30 Slots (6x5) */}
      <div className="grid grid-cols-6 gap-2">
        {slots.map(({ slotNum, pokemon }) => (
          <div
            key={slotNum}
            className={`aspect-square rounded-lg border ${
              pokemon ? "bg-white/10 border-white/20 hover:border-amber-400 cursor-pointer" : "bg-black/20 border-white/5"
            } flex items-center justify-center relative transition-all group`}
          >
            {pokemon ? (
              <>
                <img
                  src={getSpriteUrl(pokemon.pokedexNumber)}
                  alt={`Pokemon ${pokemon.pokedexNumber}`}
                  className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform"
                />
                {/* Tooltip simple por ahora */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                  <span className="capitalize">{POKEMON_NAMES[pokemon.pokedexNumber - 1]}</span>
                  <br />
                  <span className="text-amber-400">Lv. WIP</span>
                </div>
              </>
            ) : (
              <span className="text-white/10 text-[10px]">{slotNum}</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer / Stats */}
      <div className="flex justify-between items-center text-sm text-slate-400 px-2">
        <span>Cajas desbloqueadas: {boxesUnlocked}/24</span>
        <span>
          Ocupados: <span className="text-snow font-medium">{boxPokemons.length}</span>/30
        </span>
      </div>
    </div>
  );
}
