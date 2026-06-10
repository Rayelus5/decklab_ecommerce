"use server";

import { prisma } from "@/lib/prisma";
import { EggRarity, EggStatus, IncubatorType, Prisma } from "@prisma/client";

import { INCUBATION_TIMES } from "./gamification-constants";

// ============================================================================
// CANJEAR CÓDIGO PROMOCIONAL
// ============================================================================
export async function redeemPromoCode(userId: string, code: string) {
  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      return { success: false, error: "Código no válido." };
    }

    if (promoCode.isUsed) {
      return { success: false, error: "Este código ya ha sido utilizado." };
    }

    // Transacción para asegurar la consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Marcar código como usado
      await tx.promoCode.update({
        where: { id: promoCode.id },
        data: {
          isUsed: true,
          usedById: userId,
          usedAt: new Date(),
        },
      });

      // 2. Dar la recompensa (Huevo)
      if (promoCode.rewardType === "EGG") {
        const egg = await tx.pokemonEgg.create({
          data: {
            userId,
            rarity: promoCode.rarity,
            status: "INVENTORY",
          },
        });
        return { type: "EGG", data: egg };
      }

      return null;
    });

    return { success: true, reward: result };
  } catch (error) {
    console.error("Error canjeando código:", error);
    return { success: false, error: "Error interno al canjear el código." };
  }
}

// ============================================================================
// INICIAR INCUBACIÓN
// ============================================================================
export async function startIncubation(userId: string, eggId: string) {
  try {
    // 1. Obtener la incubadora infinita del usuario (si no tiene, crearla)
    let incubator = await prisma.userIncubator.findFirst({
      where: { userId, type: "INFINITE" },
    });

    if (!incubator) {
      incubator = await prisma.userIncubator.create({
        data: { userId, type: "INFINITE" },
      });
    }

    // 2. Comprobar si la incubadora está ocupada
    const currentlyIncubating = await prisma.pokemonEgg.findFirst({
      where: {
        incubatorId: incubator.id,
        status: "INCUBATING",
      },
    });

    if (currentlyIncubating) {
      return { success: false, error: "La incubadora ya está en uso." };
    }

    // 3. Comprobar que el huevo existe y está en el inventario
    const egg = await prisma.pokemonEgg.findUnique({
      where: { id: eggId },
    });

    if (!egg || egg.userId !== userId || egg.status !== "INVENTORY") {
      return { success: false, error: "Huevo no válido." };
    }

    // 4. Iniciar incubación
    await prisma.pokemonEgg.update({
      where: { id: eggId },
      data: {
        status: "INCUBATING",
        incubatorId: incubator.id,
        incubatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al incubar huevo:", error);
    return { success: false, error: "Error interno al iniciar la incubación." };
  }
}

// ============================================================================
// ECLOSIONAR HUEVO
// ============================================================================
export async function hatchEgg(userId: string, eggId: string) {
  try {
    const egg = await prisma.pokemonEgg.findUnique({
      where: { id: eggId },
    });

    if (!egg || egg.userId !== userId || egg.status !== "INCUBATING" || !egg.incubatedAt) {
      return { success: false, error: "El huevo no está incubando." };
    }

    const requiredMinutes = INCUBATION_TIMES[egg.rarity as EggRarity];
    const now = new Date();
    const elapsedMinutes = (now.getTime() - egg.incubatedAt.getTime()) / 1000 / 60;

    if (elapsedMinutes < requiredMinutes) {
      return { success: false, error: "El huevo aún no está listo para eclosionar." };
    }

    // Eclosionar el huevo (Transacción)
    const pokemonData = await prisma.$transaction(async (tx) => {
      // 1. Encontrar una caja y slot disponible
      // Limitamos por `boxesUnlocked` del usuario. Para simplificar, buscamos los slots ocupados
      // y asignamos el primero libre.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { boxesUnlocked: true },
      });

      const maxBoxes = user?.boxesUnlocked || 8;
      const pokemons = await tx.pokemonInstance.findMany({
        where: { userId },
        select: { boxNumber: true, slotNumber: true },
      });

      // Crear un mapa de ocupación
      const occupied = new Set(pokemons.map((p) => `${p.boxNumber}-${p.slotNumber}`));

      let foundBox = -1;
      let foundSlot = -1;

      for (let box = 1; box <= maxBoxes; box++) {
        for (let slot = 1; slot <= 30; slot++) {
          if (!occupied.has(`${box}-${slot}`)) {
            foundBox = box;
            foundSlot = slot;
            break;
          }
        }
        if (foundBox !== -1) break;
      }

      if (foundBox === -1) {
        throw new Error("No hay espacio en tus cajas.");
      }

      // 2. Generar Pokémon Aleatorio (Gen 1: 1 a 151)
      const pokedexNumber = Math.floor(Math.random() * 151) + 1;

      // 3. Crear Pokémon
      const pokemon = await tx.pokemonInstance.create({
        data: {
          userId,
          eggId: egg.id,
          pokedexNumber,
          boxNumber: foundBox,
          slotNumber: foundSlot,
          stats: {
            // WIP stats
            hp: Math.floor(Math.random() * 31),
            attack: Math.floor(Math.random() * 31),
            defense: Math.floor(Math.random() * 31),
          },
        },
      });

      // 4. Actualizar Huevo
      await tx.pokemonEgg.update({
        where: { id: egg.id },
        data: { status: "HATCHED" },
      });

      // 5. Comprobar si se pueden desbloquear más cajas (+8 si hay al menos 1 en cada caja actual)
      // Agrupamos por boxNumber
      const updatedPokemons = await tx.pokemonInstance.groupBy({
        by: ['boxNumber'],
        where: { userId },
      });

      const uniqueBoxesWithPokemon = updatedPokemons.length;
      if (uniqueBoxesWithPokemon >= maxBoxes && maxBoxes < 24) {
        await tx.user.update({
          where: { id: userId },
          data: { boxesUnlocked: maxBoxes + 8 },
        });
      }

      return pokemon;
    });

    return { success: true, pokemon: pokemonData };
  } catch (error: any) {
    console.error("Error al eclosionar huevo:", error);
    return { success: false, error: error.message || "Error interno al eclosionar el huevo." };
  }
}

// ============================================================================
// OBTENER INVENTARIO
// ============================================================================
export async function getUserGamificationData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pokemonedas: true,
        boxesUnlocked: true,
        proAllowanceBalance: true,
      },
    });

    const eggs = await prisma.pokemonEgg.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const incubator = await prisma.userIncubator.findFirst({
      where: { userId, type: "INFINITE" },
    });

    const pokemons = await prisma.pokemonInstance.findMany({
      where: { userId },
      orderBy: [
        { boxNumber: "asc" },
        { slotNumber: "asc" }
      ],
    });

    return {
      user,
      eggs,
      incubator,
      pokemons,
    };
  } catch (error) {
    console.error("Error obteniendo datos de gamificación:", error);
    return null;
  }
}

// ============================================================================
// MOVER POKÉMON
// ============================================================================
export async function movePokemon(userId: string, pokemonId: string, targetBox: number, targetSlot: number) {
  try {
    // 1. Validar que la caja objetivo está desbloqueada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { boxesUnlocked: true },
    });

    const maxBoxes = user?.boxesUnlocked || 8;
    if (targetBox > maxBoxes || targetBox < 1) {
      return { success: false, error: "La caja destino no está desbloqueada." };
    }

    if (targetSlot < 1 || targetSlot > 30) {
      return { success: false, error: "Slot inválido." };
    }

    // 2. Comprobar que el Pokémon pertenece al usuario
    const pokemon = await prisma.pokemonInstance.findUnique({
      where: { id: pokemonId },
    });

    if (!pokemon || pokemon.userId !== userId) {
      return { success: false, error: "Pokémon no encontrado." };
    }

    // 3. Comprobar que el slot destino está vacío
    const slotOccupied = await prisma.pokemonInstance.findFirst({
      where: {
        userId,
        boxNumber: targetBox,
        slotNumber: targetSlot,
      },
    });

    if (slotOccupied) {
      return { success: false, error: "El hueco destino ya está ocupado." };
    }

    // 4. Mover el Pokémon
    await prisma.pokemonInstance.update({
      where: { id: pokemonId },
      data: {
        boxNumber: targetBox,
        slotNumber: targetSlot,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error moviendo Pokémon:", error);
    return { success: false, error: "Error interno al mover." };
  }
}

// ============================================================================
// COMPRAR POKEMONEDAS (TIENDA)
// ============================================================================
export async function buyPokemonedas(userId: string, amountEuro: number) {
  try {
    if (amountEuro <= 0) return { success: false, error: "Cantidad no válida." };

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { proAllowanceBalance: true, pokemonedas: true },
      });

      if (!user) return { success: false, error: "Usuario no encontrado." };

      if (Number(user.proAllowanceBalance) < amountEuro) {
        return { success: false, error: "Saldo PRO insuficiente." };
      }

      // 1€ = 1000 pokemonedas
      const pokemonedasToAdd = amountEuro * 1000;

      await tx.user.update({
        where: { id: userId },
        data: {
          proAllowanceBalance: { decrement: amountEuro },
          pokemonedas: { increment: pokemonedasToAdd },
        },
      });

      return { success: true, newBalance: Number(user.proAllowanceBalance) - amountEuro, newPokemonedas: user.pokemonedas + pokemonedasToAdd };
    });
  } catch (error: any) {
    console.error("Error al comprar pokemonedas:", error);
    return { success: false, error: "Error procesando la compra." };
  }
}

// ============================================================================
// CANJEAR POKEMONEDAS POR SALDO PRO
// ============================================================================
export async function redeemPokemonedas(userId: string, amountEuro: number) {
  try {
    if (amountEuro <= 0) return { success: false, error: "Cantidad no válida." };

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { proAllowanceBalance: true, pokemonedas: true },
      });

      if (!user) return { success: false, error: "Usuario no encontrado." };

      // 1€ = 1500 pokemonedas
      const costInPokemonedas = amountEuro * 1500;

      if (user.pokemonedas < costInPokemonedas) {
        return { success: false, error: "Pokemonedas insuficientes." };
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          pokemonedas: { decrement: costInPokemonedas },
          proAllowanceBalance: { increment: amountEuro },
        },
      });

      return { success: true, newBalance: Number(user.proAllowanceBalance) + amountEuro, newPokemonedas: user.pokemonedas - costInPokemonedas };
    });
  } catch (error: any) {
    console.error("Error al canjear pokemonedas:", error);
    return { success: false, error: "Error procesando el canje." };
  }
}
