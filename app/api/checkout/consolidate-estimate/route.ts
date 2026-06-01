import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const estimateSchema = z.object({
  orderId: z.string().min(1),
  cartWeight: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = estimateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { orderId, cartWeight } = parsed.data;

    // 1. Cargar el pedido (debe pertenecer al usuario y estar activo)
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { in: ["PAID", "PROCESSING"] },
      },
      select: {
        shippingType: true,
        shippingRegion: true,
        shippingCost: true,
        items: {
          select: {
            quantity: true,
            variant: { select: { weight: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado o no elegible para consolidar" },
        { status: 404 }
      );
    }

    // 2. Calcular peso combinado
    const existingWeight = order.items.reduce(
      (sum, item) => sum + item.variant.weight * item.quantity,
      0
    );
    const combinedWeight = existingWeight + cartWeight;

    // 3. Buscar tarifa — primero en el mismo tipo
    let rate = await prisma.shippingRate.findFirst({
      where: {
        type: order.shippingType,
        region: order.shippingRegion as "NATIONAL" | "EUROPE",
        active: true,
        minWeight: { lte: combinedWeight },
        OR: [{ maxWeight: { gt: combinedWeight } }, { maxWeight: -1 }],
      },
      orderBy: { price: "asc" },
    });

    const typeChanged = !rate;

    // Si no hay tarifa del mismo tipo → buscar en cualquier tipo (más barato disponible)
    if (!rate) {
      rate = await prisma.shippingRate.findFirst({
        where: {
          region: order.shippingRegion as "NATIONAL" | "EUROPE",
          active: true,
          minWeight: { lte: combinedWeight },
          OR: [{ maxWeight: { gt: combinedWeight } }, { maxWeight: -1 }],
        },
        orderBy: { price: "asc" },
      });
    }

    if (!rate) {
      return NextResponse.json(
        { error: "No existe ninguna tarifa activa para el peso combinado de este envío" },
        { status: 422 }
      );
    }

    const originalShippingCost = Number(order.shippingCost);
    const ratePrice = Number(rate.price);
    const difference = Math.max(0, ratePrice - originalShippingCost);

    return NextResponse.json({
      combinedWeight,
      existingWeight,
      cartWeight,
      rateName: rate.name,
      rateType: rate.type,
      ratePrice,
      originalShippingCost,
      difference,
      typeChanged,
    });
  } catch (error) {
    console.error("[CONSOLIDATE ESTIMATE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
