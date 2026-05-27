import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendOrderStatusDM } from "@/lib/telegram";
import { sendOrderCancellationEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAuth();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;

    // Obtener el pedido con items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            variantId: true,
            quantity: true,
            pricePaid: true,
            wasProPrice: true,
            variant: { select: { proExempt: true } },
          },
        },
        user: { select: { telegramId: true } },
      },
    });

    // Ownership check: 404 en lugar de 403 para no revelar existencia
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Solo cancelar si está en estado cancelable
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return NextResponse.json(
        { error: "Este pedido no se puede cancelar. Solo puedes cancelar pedidos en estado Pendiente o Pagado." },
        { status: 409 }
      );
    }

    // Si está pagado y tiene payment intent → emitir reembolso en Stripe
    if (order.status === "PAID" && order.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: "requested_by_customer",
        });
      } catch (err) {
        console.error("[CANCEL ORDER] Stripe refund failed:", err);
        return NextResponse.json(
          { error: "No se pudo procesar el reembolso. Contacta con soporte." },
          { status: 500 }
        );
      }
    }

    // Transacción atómica
    await prisma.$transaction(async (tx) => {
      // 1. Marcar como cancelado
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // 2. Liberar stock según el estado previo
      for (const item of order.items) {
        if (order.status === "PENDING") {
          // Stock nunca fue decrementado → solo liberar reserva
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { decrement: item.quantity } },
          });
        } else {
          // PAID → webhook ya decrementó stock y reservedStock → restaurar stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      // 3. Restaurar allowance PRO si aplica
      const proDeduction = order.items.reduce((sum, item) => {
        if (item.wasProPrice && !item.variant.proExempt) {
          return sum + Number(item.pricePaid) * item.quantity;
        }
        return sum;
      }, 0);

      if (proDeduction > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { proAllowanceBalance: { increment: proDeduction } },
        });
      }
    });

    // Notificaciones — no bloqueantes
    if (order.user.telegramId) {
      sendOrderStatusDM({
        telegramId: order.user.telegramId,
        orderNumber: order.orderNumber,
        newStatus: "CANCELLED",
      }).catch((e) => console.error("[CANCEL ORDER] Telegram DM failed:", e));
    }

    sendOrderCancellationEmail(id, false).catch((e) =>
      console.error("[CANCEL ORDER] Email failed:", e)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CANCEL ORDER]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
