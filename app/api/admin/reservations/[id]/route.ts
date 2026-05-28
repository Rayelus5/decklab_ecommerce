import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/reservations/[id]
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const reservation = await prisma.reservationPeriod.findUnique({
    where: { id },
    include: {
      coupon: { select: { id: true, code: true, usesCount: true, maxUses: true, type: true, value: true } },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return NextResponse.json(reservation);
}

/**
 * PATCH /api/admin/reservations/[id]
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  let body: Partial<{
    name: string;
    description: string | null;
    opensAt: string;
    closesAt: string;
    deliveryDate: string | null;
    couponId: string | null;
    productIds: string[];
    badgeText: string;
    popupEnabled: boolean;
    maxUnits: number | null;
    isActive: boolean;
  }>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.reservationPeriod.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const opensAt = body.opensAt ? new Date(body.opensAt) : existing.opensAt;
  const closesAt = body.closesAt ? new Date(body.closesAt) : existing.closesAt;

  if (opensAt >= closesAt) {
    return NextResponse.json(
      { error: "opensAt debe ser anterior a closesAt" },
      { status: 400 }
    );
  }

  const updated = await prisma.reservationPeriod.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.opensAt !== undefined && { opensAt }),
      ...(body.closesAt !== undefined && { closesAt }),
      ...(body.deliveryDate !== undefined && {
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      }),
      ...(body.couponId !== undefined && { couponId: body.couponId }),
      ...(body.productIds !== undefined && { productIds: body.productIds }),
      ...(body.badgeText !== undefined && { badgeText: body.badgeText }),
      ...(body.popupEnabled !== undefined && { popupEnabled: body.popupEnabled }),
      ...(body.maxUnits !== undefined && { maxUnits: body.maxUnits }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: {
      coupon: { select: { id: true, code: true, usesCount: true, maxUses: true } },
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/reservations/[id]
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const existing = await prisma.reservationPeriod.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  await prisma.reservationPeriod.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
