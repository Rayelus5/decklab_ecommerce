import { EggRarity } from "@prisma/client";

export const INCUBATION_TIMES: Record<EggRarity, number> = {
  COMMON: 30,
  UNCOMMON: 60,    // 1 hora
  RARE: 180,       // 3 horas
  EPIC: 480,       // 8 horas
  LEGENDARY: 1440, // 24 horas
  MYTHIC: 1440,    // 24 horas
};

// ============================================================================
// TIENDA DE OBJETOS
// ============================================================================
export const SHOP_ITEMS = {
  MYSTERY_EGG:   { pkmPrice: 3_000, label: "Huevo Misterioso" },
  BOX_EXPANSION: { pkmPrice: 5_000, label: "Ticket de Expansión de Caja" },
} as const;

export type ShopItemType = keyof typeof SHOP_ITEMS;

// ============================================================================
// POOLS DE POKÉMON POR RAREZA (Gen 1, #1-151)
// ============================================================================
// COMMON  — básicos de ruta temprana
// UNCOMMON — segunda etapa y Pokémon intermedios
// RARE    — starters finales, evoluciones fuertes, Pokémon especiales
// EPIC    — pseudo-legendarios (Dragonite, Alakazam, Gengar, Gyarados…)
// LEGENDARY — aves legendarias + Mewtwo
// MYTHIC  — solo Mew (#151)
export const POKEMON_POOLS: Record<EggRarity, number[]> = {
  COMMON: [
    10, 11, 13, 14, 16, 19, 20, 21, 23,
    41, 50, 52, 54, 56, 60, 63, 66, 69,
    72, 74, 81, 90, 92, 98, 100, 102,
    109, 116, 118, 120, 129,
  ],
  UNCOMMON: [
    1, 4, 7, 17, 22, 24, 25, 42, 51,
    53, 55, 61, 67, 70, 75, 82, 91, 93,
    99, 101, 103, 110, 117, 119, 121,
    130, 133,
  ],
  RARE: [
    2, 3, 5, 6, 8, 9, 18, 26, 43, 44,
    45, 46, 47, 48, 49, 58, 59, 62, 64,
    65, 68, 71, 76, 79, 80, 84, 85, 86,
    87, 88, 89, 94, 95, 96, 97, 104,
    105, 106, 107, 108, 111, 112, 113,
    114, 115, 122, 123, 124, 125, 126,
    127, 128, 131, 132, 136, 137, 138,
    139, 140, 141, 142, 143,
  ],
  EPIC: [
    3, 6, 9, 65, 68, 94, 130, 131,
    134, 135, 136, 143, 147, 148, 149,
  ],
  LEGENDARY: [144, 145, 146, 149, 150],
  MYTHIC:    [151],
};
