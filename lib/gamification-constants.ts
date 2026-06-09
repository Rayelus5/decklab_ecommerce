import { EggRarity } from "@prisma/client";

// Mapeo de tiempos de incubación en minutos
export const INCUBATION_TIMES: Record<EggRarity, number> = {
  COMMON: 30,
  UNCOMMON: 60, // 1 hora
  RARE: 180, // 3 horas
  EPIC: 480, // 8 horas
  LEGENDARY: 1440, // 24 horas
  MYTHIC: 1440, // 24 horas
};
