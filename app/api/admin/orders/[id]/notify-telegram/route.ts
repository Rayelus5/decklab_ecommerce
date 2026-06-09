import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusDM } from "@/lib/telegram";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { telegramId: true } }, shipment: true },
    });

    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const trackingNumber = order.shipment?.trackingNumber ?? undefined;

    // Send to buyer if they have telegramId
    if (order.user.telegramId) {
      await sendOrderStatusDM({
        telegramId: order.user.telegramId,
        orderNumber: order.orderNumber,
        newStatus: order.status,
        trackingNumber,
      }).catch(console.error);
    }

    // Send to creator
    await sendOrderStatusDM({
      telegramId: "1856500527",
      orderNumber: order.orderNumber,
      newStatus: order.status,
      trackingNumber,
      isCreator: true,
    }).catch(console.error);

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "ORDER_STATUS_NOTIFIED",
        targetId: id,
        targetType: "Order",
        details: { status: order.status, trackingNumber, notifiedBuyer: !!order.user.telegramId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN ORDER NOTIFY TELEGRAM]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
