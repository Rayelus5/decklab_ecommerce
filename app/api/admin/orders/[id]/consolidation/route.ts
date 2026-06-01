import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PATCH — Vincular este pedido con otro (este queda como secundario) ───────
const linkSchema = z.object({
  consolidateWithOrderId: z.string().min(1, "Indica el ID del pedido base"),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (isErrorResponse(adminResult)) return adminResult;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { consolidateWithOrderId } = parsed.data;

    if (consolidateWithOrderId === id) {
      return NextResponse.json(
        { error: "Un pedido no puede consolidarse consigo mismo" },
        { status: 400 }
      );
    }

    // Verificar que el pedido base existe
    const baseOrder = await prisma.order.findUnique({
      where: { id: consolidateWithOrderId },
      select: {
        id: true,
        orderNumber: true,
        consolidatedWithOrderId: true,
      },
    });

    if (!baseOrder) {
      return NextResponse.json({ error: "El pedido base no existe" }, { status: 404 });
    }

    // Evitar cadenas: el pedido base no puede ser a su vez secundario
    if (baseOrder.consolidatedWithOrderId) {
      return NextResponse.json(
        {
          error: `El Pedido #${baseOrder.orderNumber} ya está consolidado con otro pedido. Elige el pedido base original.`,
        },
        { status: 400 }
      );
    }

    // Verificar que el pedido actual existe
    const thisOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true },
    });

    if (!thisOrder) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Vincular
    const updated = await prisma.order.update({
      where: { id },
      data: { consolidatedWithOrderId: consolidateWithOrderId },
      select: {
        id: true,
        orderNumber: true,
        consolidatedWithOrderId: true,
        consolidatedWith: { select: { id: true, orderNumber: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN CONSOLIDATION PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─── DELETE — Desvincular ─────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const adminResult = await requireAdmin();
  if (isErrorResponse(adminResult)) return adminResult;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, consolidatedWithOrderId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (!order.consolidatedWithOrderId) {
      return NextResponse.json(
        { error: "Este pedido no tiene consolidación activa" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: { consolidatedWithOrderId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN CONSOLIDATION DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
