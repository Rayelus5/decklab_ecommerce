import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendOrderStatusDM } from "@/lib/telegram";
import { sendShipmentTrackingEmail } from "@/lib/email";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { status, trackingNumber, carrier } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true, user: { select: { telegramId: true, name: true } } },
    });

    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: status ? { status } : {},
    });

    // Update or create shipment if tracking info provided
    if (trackingNumber !== undefined || carrier !== undefined) {
      const shipmentData: Record<string, unknown> = {};
      if (trackingNumber !== undefined) shipmentData.trackingNumber = trackingNumber;
      if (carrier !== undefined) shipmentData.carrier = carrier;
      if (status === "SHIPPED" && !order.shipment?.shippedAt) {
        shipmentData.shippedAt = new Date();
      }
      if (status === "DELIVERED" && !order.shipment?.deliveredAt) {
        shipmentData.deliveredAt = new Date();
      }

      await prisma.shipment.upsert({
        where: { orderId: id },
        create: { orderId: id, ...shipmentData },
        update: shipmentData,
      });
    }

    // Pokémonedas reward cuando el pedido se marca como entregado (solo primera vez)
    if (status === "DELIVERED" && order.status !== "DELIVERED") {
      await prisma.user.update({
        where: { id: order.userId },
        data: { pokemonedas: { increment: 500 } },
      }).catch((e) => console.error("[POKEMONEDAS DELIVERY]", e));
    }

    // Telegram DM + email de tracking cuando el estado es SHIPPED
    if (status === "SHIPPED") {
      if (order.user.telegramId) {
        await sendOrderStatusDM({
          telegramId: order.user.telegramId,
          orderNumber: order.orderNumber,
          newStatus: status,
          trackingNumber,
        }).catch((e) => console.error("[TELEGRAM DM]", e));
      }
      // Solo enviar email de tracking si hay número de tracking
      const finalTracking = trackingNumber ?? order.shipment?.trackingNumber;
      if (finalTracking) {
        await sendShipmentTrackingEmail(id).catch((e) =>
          console.error("[EMAIL TRACKING]", e)
        );
      }
    } else if (status && order.user.telegramId) {
      await sendOrderStatusDM({
        telegramId: order.user.telegramId,
        orderNumber: order.orderNumber,
        newStatus: status,
        trackingNumber,
      }).catch((e) => console.error("[TELEGRAM DM]", e));
    }

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "ORDER_STATUS_CHANGED",
        targetId: id,
        targetType: "Order",
        details: { previousStatus: order.status, newStatus: status, trackingNumber },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[ADMIN ORDER PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
