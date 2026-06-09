"use server";

import { prisma } from "@/lib/prisma";
import { EggRarity } from "@prisma/client";

export async function createPromoCodeAdmin(data: {
  code: string;
  rarity: EggRarity;
  count: number;
}) {
  try {
    const codes = [];
    
    for (let i = 0; i < data.count; i++) {
      // Si count es 1, usamos el código exacto. Si es > 1, añadimos sufijos aleatorios.
      const actualCode = data.count === 1 
        ? data.code 
        : `${data.code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      codes.push({
        code: actualCode.toUpperCase(),
        rarity: data.rarity,
        rewardType: "EGG" as const,
      });
    }

    await prisma.promoCode.createMany({
      data: codes,
      skipDuplicates: true, // Por si acaso hay colisiones
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating promo codes:", error);
    return { success: false, error: "Error al generar los códigos" };
  }
}
