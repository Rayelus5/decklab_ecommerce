import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const SAFE_STATUSES = ["PENDING", "CANCELLED", "REFUNDED"];

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        marketplaceShipping: true,
        marketplacePayOption: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Para pedidos PENDING: liberar reservedStock
      if (order.status === "PENDING") {
        for (const item of order.items) {
          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
            WHERE id = ${item.variantId}
          `;
        }
      }

      // Borrar Shipment manualmente (no tiene onDelete: Cascade)
      await tx.shipment.deleteMany({ where: { orderId: id } });

      // Borrar el pedido (OrderItems se eliminan en cascada)
      await tx.order.delete({ where: { id } });

      await tx.adminActionLog.create({
        data: {
          adminId: session.user.id,
          actionType: "ORDER_STATUS_CHANGED",
          targetId: id,
          targetType: "Order",
          details: { action: "ORDER_DELETED", orderNumber: order.orderNumber, status: order.status, forced: !SAFE_STATUSES.includes(order.status) },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN ORDER DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
