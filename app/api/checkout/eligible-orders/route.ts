import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");

    if (!region || (region !== "NATIONAL" && region !== "EUROPE")) {
      return NextResponse.json({ error: "Región no válida" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PAID", "PROCESSING"] },
        shippingRegion: region,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        shippingType: true,
        shippingRegion: true,
        shippingCost: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            variant: { select: { weight: true } },
          },
        },
      },
    });

    const result = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      shippingType: order.shippingType,
      shippingRegion: order.shippingRegion,
      shippingCost: Number(order.shippingCost),
      createdAt: order.createdAt.toISOString(),
      orderWeight: order.items.reduce(
        (sum, item) => sum + item.variant.weight * item.quantity,
        0
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ELIGIBLE ORDERS]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
