"use client";

import { useState } from "react";
import { PokemonInstance } from "@prisma/client";
import { ChevronLeft, ChevronRight, BarChart2, Move, X } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { movePokemon } from "@/lib/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  userId: string;
}

export function InventoryBoxes({ pokemons, boxesUnlocked, userId }: Props) {
  const router = useRouter();

  const [currentBox, setCurrentBox] = useState(1);
  const [movingPokemon, setMovingPokemon] = useState<PokemonInstance | null>(null);
  const [statsPokemon, setStatsPokemon] = useState<PokemonInstance | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const prevBox = () => setCurrentBox((prev) => Math.max(1, prev - 1));
  const nextBox = () => setCurrentBox((prev) => Math.min(boxesUnlocked, prev + 1));

  const boxPokemons = pokemons.filter((p) => p.boxNumber === currentBox);
  const slots = Array.from({ length: 30 }, (_, i) => {
    const slotNum = i + 1;
    const pokemon = boxPokemons.find((p) => p.slotNumber === slotNum);
    return { slotNum, pokemon };
  });

  const getSpriteUrl = (pokedexNumber: number) => {
    const name = POKEMON_NAMES[pokedexNumber - 1];
    return name ? `https://img.pokemondb.net/sprites/lets-go-pikachu-eevee/normal/${name}.png` : "";
  };

  const getHqArtworkUrl = (pokedexNumber: number) => {
    const name = POKEMON_NAMES[pokedexNumber - 1];
    return name ? `https://img.pokemondb.net/artwork/large/${name}.jpg` : "";
  };

  const handleSlotClick = async (slotNum: number, pokemon?: PokemonInstance) => {
    if (movingPokemon) {
      if (pokemon) {
        toast.error("Ese hueco ya está ocupado.");
        return;
      }

      if (!userId) return;

      setIsMoving(true);
      const res = await movePokemon(userId, movingPokemon.id, currentBox, slotNum);
      if (res.success) {
        toast.success("Pokémon movido.");
        setMovingPokemon(null);
        router.refresh();
      } else {
        toast.error(res.error || "Error al mover.");
      }
      setIsMoving(false);
    }
  };

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col gap-6 relative">

      {/* Banner de Modo Mover */}
      {movingPokemon && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] z-20 flex items-center gap-3 animate-in slide-in-from-top-4">
          <span>Selecciona un hueco vacío para mover a {POKEMON_NAMES[movingPokemon.pokedexNumber - 1].toUpperCase()}</span>
          <button
            onClick={() => setMovingPokemon(null)}
            className="bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Box Header Controls */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2 relative z-10">
        <button onClick={prevBox} disabled={currentBox === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors">
          <ChevronLeft className="text-white" />
        </button>
        <h2 className="text-xl font-bold text-snow">CAJA {currentBox}</h2>
        <button onClick={nextBox} disabled={currentBox === boxesUnlocked} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors">
          <ChevronRight className="text-white" />
        </button>
      </div>

      {/* Grid de 30 Slots (6x5) */}
      <div className="grid grid-cols-6 gap-2 relative z-10">
        {slots.map(({ slotNum, pokemon }) => {
          const isSlotMovingSource = movingPokemon?.id === pokemon?.id;
          const isSlotAvailable = movingPokemon && !pokemon;

          return (
            <div key={slotNum} className="relative aspect-square">
              {pokemon ? (
                // Dropdown Menu para los Pokémon
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild disabled={!!movingPokemon}>
                    <button
                      className={`w-full h-full rounded-lg border flex items-center justify-center relative transition-all group overflow-hidden ${isSlotMovingSource
                        ? "bg-amber-500/20 border-amber-500 animate-pulse scale-90 opacity-50"
                        : "bg-white/10 border-white/20 hover:border-amber-400 hover:bg-white/20"
                        }`}
                    >
                      <img
                        src={getSpriteUrl(pokemon.pokedexNumber)}
                        alt={`Pokemon ${pokemon.pokedexNumber}`}
                        className="w-full h-full object-cover scale-[1.2] group-hover:scale-[1.4] transition-transform pixelated mb-10"
                      />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-[160px] bg-graphite-800 border border-white/10 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <DropdownMenu.Item
                        onClick={() => setStatsPokemon(pokemon)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-snow hover:bg-white/10 rounded-lg cursor-pointer outline-none transition-colors"
                      >
                        <BarChart2 size={16} className="text-sky-400" />
                        <span>Ver estadísticas</span>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => setMovingPokemon(pokemon)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-snow hover:bg-white/10 rounded-lg cursor-pointer outline-none transition-colors"
                      >
                        <Move size={16} className="text-amber-400" />
                        <span>Mover</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                // Hueco Vacío
                <button
                  onClick={() => handleSlotClick(slotNum)}
                  disabled={!movingPokemon || isMoving}
                  className={`w-full h-full rounded-lg border flex items-center justify-center transition-all ${isSlotAvailable
                    ? "bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 hover:scale-105 cursor-pointer border-dashed"
                    : "bg-black/20 border-white/5 cursor-default"
                    }`}
                >
                  <span className="text-white/10 text-[10px]">{slotNum}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Stats */}
      <div className="flex justify-between items-center text-sm text-slate-400 px-2 relative z-10">
        <span>Cajas desbloqueadas: {boxesUnlocked}/24</span>
        <span>
          Ocupados: <span className="text-snow font-medium">{boxPokemons.length}</span>/30
        </span>
      </div>

      {/* Modal de Estadísticas (Stats WIP) */}
      <Dialog.Root open={!!statsPokemon} onOpenChange={(open) => !open && setStatsPokemon(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md bg-graphite-800 border border-white/10 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

            {statsPokemon && (
              <div className="flex flex-col relative">
                <button
                  onClick={() => setStatsPokemon(null)}
                  className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10"
                >
                  <X size={20} />
                </button>

                {/* Header (Background Color base) */}
                <div className="h-40 bg-gradient-to-b from-amber-500/20 to-graphite-800 relative flex justify-center items-end pb-4">
                  <div className="absolute top-4 left-4 bg-black/40 px-3 py-1 text-xs font-bold text-white rounded-full tracking-wider border border-white/10 backdrop-blur-sm">
                    No. {String(statsPokemon.pokedexNumber).padStart(3, '0')}
                  </div>
                </div>

                {/* Artwork HD */}
                <div className="w-48 h-48 mx-auto -mt-32 relative z-10 bg-white/5 rounded-full border-4 border-graphite-800 overflow-hidden shadow-2xl flex items-center justify-center p-4 bg-white">
                  <img
                    src={getHqArtworkUrl(statsPokemon.pokedexNumber)}
                    alt="Pokemon Artwork"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Content */}
                <div className="p-8 pt-6 flex flex-col items-center gap-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-snow uppercase tracking-widest">
                      {POKEMON_NAMES[statsPokemon.pokedexNumber - 1]}
                    </h2>
                    <p className="text-amber-400 font-bold mt-1 tracking-widest text-sm">LVL. WIP</p>
                  </div>

                  {/* Stats (WIP) */}
                  <div className="w-full bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col gap-3 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500/20 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest backdrop-blur-sm">
                      Funcionalidad en desarrollo
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-10 text-xs font-bold text-slate-400 uppercase">HP</span>
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-0"></div>
                      </div>
                      <span className="w-6 text-right text-xs font-bold text-snow">0</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-10 text-xs font-bold text-slate-400 uppercase">ATK</span>
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-0"></div>
                      </div>
                      <span className="w-6 text-right text-xs font-bold text-snow">0</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="w-10 text-xs font-bold text-slate-400 uppercase">DEF</span>
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-0"></div>
                      </div>
                      <span className="w-6 text-right text-xs font-bold text-snow">0</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
