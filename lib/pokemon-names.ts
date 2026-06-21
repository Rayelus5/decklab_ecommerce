// Nombres de los 151 Pokémon de la Generación 1 (índice 0 = #1 Bulbasaur)
// Usados en sprites y artworks de pokemondb.net
export const POKEMON_NAMES: string[] = [
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
  "dratini", "dragonair", "dragonite", "mewtwo", "mew",
];

export function getPokemonName(pokedexNumber: number): string {
  return POKEMON_NAMES[pokedexNumber - 1] ?? "unknown";
}

export function getSpriteUrl(pokedexNumber: number): string {
  const name = getPokemonName(pokedexNumber);
  return `https://img.pokemondb.net/sprites/lets-go-pikachu-eevee/normal/${name}.png`;
}

export function getArtworkUrl(pokedexNumber: number): string {
  const name = getPokemonName(pokedexNumber);
  return `https://img.pokemondb.net/artwork/large/${name}.jpg`;
}

// Sprite animado pixelado desde atrás (jugador) — Black/White
export function getBattlePlayerSprite(pokedexNumber: number): string {
  const name = getPokemonName(pokedexNumber);
  return `https://img.pokemondb.net/sprites/black-white/anim/back-normal/${name}.gif`;
}

// Sprite animado pixelado de frente (enemigo) — Black/White
export function getBattleEnemySprite(pokedexNumber: number): string {
  const name = getPokemonName(pokedexNumber);
  return `https://img.pokemondb.net/sprites/black-white/anim/normal/${name}.gif`;
}
