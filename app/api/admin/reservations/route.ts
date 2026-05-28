import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/reservations
 * Lista paginada de periodos de reserva
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const onlyActive = searchParams.get("active") === "1";

  const where = onlyActive ? { isActive: true } : {};

  const [reservations, total] = await Promise.all([
    prisma.reservationPeriod.findMany({
      where,
      orderBy: { closesAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        coupon: { select: { id: true, code: true, usesCount: true, maxUses: true } },
      },
    }),
    prisma.reservationPeriod.count({ where }),
  ]);

  return NextResponse.json({
    reservations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

/**
 * POST /api/admin/reservations
 * Crea un nuevo periodo de reserva
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  let body: {
    name: string;
    description?: string;
    opensAt: string;
    closesAt: string;
    deliveryDate?: string;
    couponId?: string;
    productIds?: string[];
    badgeText?: string;
    popupEnabled?: boolean;
    maxUnits?: number;
    isActive?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, opensAt, closesAt } = body;

  if (!name || !opensAt || !closesAt) {
    return NextResponse.json(
      { error: "name, opensAt y closesAt son obligatorios" },
      { status: 400 }
    );
  }

  if (new Date(opensAt) >= new Date(closesAt)) {
    return NextResponse.json(
      { error: "opensAt debe ser anterior a closesAt" },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservationPeriod.create({
    data: {
      name,
      description: body.description ?? null,
      opensAt: new Date(opensAt),
      closesAt: new Date(closesAt),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      couponId: body.couponId ?? null,
      productIds: body.productIds ?? [],
      badgeText: body.badgeText ?? "RESERVA",
      popupEnabled: body.popupEnabled ?? true,
      maxUnits: body.maxUnits ?? null,
      isActive: body.isActive ?? true,
    },
    include: {
      coupon: { select: { id: true, code: true, usesCount: true, maxUses: true } },
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}
