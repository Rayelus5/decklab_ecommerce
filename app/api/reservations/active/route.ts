import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

/**
 * GET /api/reservations/active
 * Devuelve la reserva activa con popup habilitado más próxima a cerrar.
 * Resultado cacheado 60 s (ISR).
 */
export async function GET() {
  const now = new Date();

  const reservation = await prisma.reservationPeriod.findFirst({
    where: {
      isActive: true,
      popupEnabled: true,
      opensAt: { lte: now },
      closesAt: { gt: now },
    },
    orderBy: { closesAt: "asc" }, // La más urgente primero
    select: {
      id: true,
      name: true,
      description: true,
      closesAt: true,
      deliveryDate: true,
      productIds: true,
      badgeText: true,
      maxUnits: true,
      coupon: {
        select: {
          code: true,
          usesCount: true,
          type: true,
          value: true,
        },
      },
    },
  });

  if (!reservation) {
    return NextResponse.json({ reservation: null });
  }

  // Calcular plazas restantes
  const spotsRemaining =
    reservation.maxUnits != null && reservation.coupon
      ? Math.max(0, reservation.maxUnits - reservation.coupon.usesCount)
      : null;

  return NextResponse.json({
    reservation: {
      ...reservation,
      spotsRemaining,
    },
  });
}
