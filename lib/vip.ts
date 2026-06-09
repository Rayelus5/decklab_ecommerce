"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================================================
// ACTUALIZAR ESTADÍSTICAS VIP Y TIER TRAS UN PEDIDO
// ============================================================================
export async function updateUserVipStats(userId: string, orderTotal: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalSpent: true,
        totalOrdersCount: true,
        vipTierId: true,
        proAllowanceBalance: true,
      },
    });

    if (!user) return { success: false, error: "Usuario no encontrado." };

    // 1. Nuevos totales
    const newTotalSpent = new Prisma.Decimal(user.totalSpent).plus(orderTotal);
    const newTotalOrders = user.totalOrdersCount + 1;

    // 2. Comprobar si califica para un Tier VIP
    const allTiers = await prisma.vipTier.findMany({
      orderBy: [
        { minSpent: "desc" },
        { minOrders: "desc" },
      ],
    });

    let newTierId = null;
    let currentTier = null;

    for (const tier of allTiers) {
      if (newTotalSpent.gte(tier.minSpent) && newTotalOrders >= tier.minOrders) {
        newTierId = tier.id;
        currentTier = tier;
        break; // Encontramos el más alto gracias al order by desc
      }
    }

    // 3. Calcular Cashback si hay un tier calificado
    let cashbackAmount = new Prisma.Decimal(0);
    if (currentTier && currentTier.cashbackPercent) {
      cashbackAmount = new Prisma.Decimal(orderTotal).times(currentTier.cashbackPercent).dividedBy(100);
    }

    // 4. Actualizar usuario
    const newBalance = new Prisma.Decimal(user.proAllowanceBalance).plus(cashbackAmount);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalSpent: newTotalSpent,
        totalOrdersCount: newTotalOrders,
        vipTierId: newTierId,
        proAllowanceBalance: newBalance,
      },
      include: {
        vipTier: true,
      },
    });

    return { success: true, user: updatedUser, cashbackAwarded: cashbackAmount.toNumber() };
  } catch (error) {
    console.error("Error actualizando estadísticas VIP:", error);
    return { success: false, error: "Error interno actualizando VIP." };
  }
}

// ============================================================================
// CRUD VIP TIERS (Para el Admin)
// ============================================================================
export async function getVipTiers() {
  return await prisma.vipTier.findMany({
    orderBy: { level: "asc" },
  });
}

export async function createVipTier(data: {
  level: number;
  name: string;
  minSpent: number;
  minOrders: number;
  cashbackPercent: number;
  color: string;
  iconImage: string;
}) {
  return await prisma.vipTier.create({
    data,
  });
}

export async function updateVipTier(id: string, data: any) {
  return await prisma.vipTier.update({
    where: { id },
    data,
  });
}

export async function deleteVipTier(id: string) {
  return await prisma.vipTier.delete({
    where: { id },
  });
}

// ============================================================================
// RECALCULAR TODOS LOS USUARIOS (Manual Action)
// ============================================================================
export async function recalculateAllUsersVip() {
  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });

    const allTiers = await prisma.vipTier.findMany({
      orderBy: [
        { minSpent: "desc" },
        { minOrders: "desc" },
      ],
    });

    let updatedCount = 0;

    for (const user of allUsers) {
      // Calcular totales históricos de órdenes PAID
      const orders = await prisma.order.findMany({
        where: { userId: user.id, isPaid: true },
        select: { total: true },
      });

      const totalOrdersCount = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum.plus(order.total), new Prisma.Decimal(0));

      let newTierId = null;

      for (const tier of allTiers) {
        if (totalSpent.gte(tier.minSpent) && totalOrdersCount >= tier.minOrders) {
          newTierId = tier.id;
          break;
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalSpent,
          totalOrdersCount,
          vipTierId: newTierId,
        },
      });
      updatedCount++;
    }

    return { success: true, updatedCount };
  } catch (error) {
    console.error("Error recalculando VIP de usuarios:", error);
    return { success: false, error: "Error interno recalculando." };
  }
}

