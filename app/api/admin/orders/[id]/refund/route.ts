import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendOrderCancellationEmail } from "@/lib/email";

export async function POST(
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (order.status !== "PAID" && order.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Solo se pueden reembolsar pedidos en estado Pagado o Procesando." },
        { status: 409 }
      );
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Este pedido no tiene un ID de pago de Stripe. No se puede emitir reembolso automático." },
        { status: 400 }
      );
    }

    // Emitir reembolso en Stripe
    try {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: "requested_by_customer",
      });
    } catch (err) {
      console.error("[ADMIN REFUND] Stripe refund failed:", err);
      return NextResponse.json(
        { error: "El reembolso de Stripe falló. Inténtalo desde el Dashboard de Stripe." },
        { status: 500 }
      );
    }

    // Transacción atómica
    await prisma.$transaction(async (tx) => {
      // 1. Cambiar estado
      await tx.order.update({
        where: { id },
        data: { status: "REFUNDED" },
      });

      // 2. Restaurar stock (el webhook ya había decrementado stock y reservedStock)
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
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
          where: { id: order.userId },
          data: { proAllowanceBalance: { increment: proDeduction } },
        });
      }

      // 4. Log de auditoría
      await tx.adminActionLog.create({
        data: {
          adminId: session.user.id,
          actionType: "ORDER_REFUNDED",
          targetId: id,
          targetType: "Order",
          details: {
            previousStatus: order.status,
            stripePaymentIntentId: order.stripePaymentIntentId,
          },
        },
      });
    });

    // Email al cliente — no bloqueante
    sendOrderCancellationEmail(id, true).catch((e) =>
      console.error("[ADMIN REFUND] Email failed:", e)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN REFUND]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
