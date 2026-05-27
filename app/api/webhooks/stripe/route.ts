import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { refillProAllowance } from "@/lib/pro-logic";
import { notifyPurchase } from "@/lib/telegram";

// Deshabilitar el body parser de Next.js para verificar la firma de Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, addressId, shippingRateId, shippingType, shippingRegion, couponCode, cartItems, isPro } =
    session.metadata ?? {};

  if (!userId || !addressId || !shippingRateId || !cartItems) {
    console.error("[WEBHOOK] Missing metadata in session", session.id);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : null;

  // Verificar idempotencia: si ya procesamos este payment intent, saltar
  if (paymentIntentId) {
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true },
    });
    if (existing) {
      console.log("[WEBHOOK] Order already processed for payment intent:", paymentIntentId);
      return;
    }
  }

  const parsedItems = JSON.parse(cartItems) as Array<{
    variantId: string;
    quantity: number;
    pricePaid: number;
    wasProPrice: boolean;
  }>;

  // Obtener shipping rate para snapshot
  const shippingRate = await prisma.shippingRate.findUnique({
    where: { id: shippingRateId },
    select: { price: true },
  });

  // Obtener variantes para decrementar stock
  const variantIds = parsedItems.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, stock: true, proExempt: true },
  });

  // Calcular total
  const subtotal = parsedItems.reduce((sum, item) => sum + item.pricePaid * item.quantity, 0);
  const shippingCost = Number(shippingRate?.price ?? 0);
  const total = subtotal + shippingCost;

  // Obtener cupón si se usó
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  }

  // Transacción atómica
  const order = await prisma.$transaction(async (tx) => {
    // 1. Crear el pedido
    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId,
        stripePaymentIntentId: paymentIntentId,
        paymentMethod: "STRIPE",
        status: "PAID",
        isPaid: true,
        shippingType: shippingType ?? "ORDINARIO",
        shippingRegion: shippingRegion ?? "NATIONAL",
        shippingCost,
        subtotal,
        total,
        couponId: coupon?.id ?? null,
        couponCode: coupon ? couponCode : null,
        items: {
          create: parsedItems.map((item) => {
            const variant = variants.find((v) => v.id === item.variantId);
            return {
              variantId: item.variantId,
              quantity: item.quantity,
              pricePaid: item.pricePaid,
              wasProPrice: item.wasProPrice && !variant?.proExempt,
            };
          }),
        },
      },
      include: { items: true },
    });

    // 2. Decrementar stock
    for (const item of parsedItems) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. Descontar allowance PRO
    if (isPro === "true") {
      const proDeduction = parsedItems.reduce((sum, item) => {
        const variant = variants.find((v) => v.id === item.variantId);
        if (item.wasProPrice && !variant?.proExempt) {
          return sum + item.pricePaid * item.quantity;
        }
        return sum;
      }, 0);

      if (proDeduction > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { proAllowanceBalance: { decrement: proDeduction } },
        });
      }
    }

    // 4. Incrementar usos de cupón
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usesCount: { increment: 1 } },
      });
    }

    // 5. Crear registro de Shipment vacío
    await tx.shipment.create({
      data: { orderId: newOrder.id },
    });

    return newOrder;
  });

  // 6. Notificar bot de Telegram
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, telegramId: true },
    });

    const firstItem = parsedItems[0];
    const firstVariant = firstItem
      ? await prisma.productVariant.findUnique({
          where: { id: firstItem.variantId },
          include: { product: { select: { title: true } } },
        })
      : null;

    await notifyPurchase({
      userName: user?.name ?? "Cliente",
      productName: firstVariant?.product.title ?? "Producto",
      total: total.toFixed(2),
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error("[WEBHOOK] Error notifying Telegram:", err);
  }

  // 7. Enviar email de confirmación (Sprint 10)
  console.log(`[WEBHOOK] Order #${order.orderNumber} created for user ${userId}, total: ${total}€`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Refill de allowance PRO en renovación de suscripción
  // En Stripe SDK v12+, subscription es parte del invoice
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null;

  if (!subscriptionId || typeof subscriptionId !== "string") return;

  const user = await prisma.user.findFirst({
    where: { proSubscriptionId: subscriptionId },
    select: { id: true },
  });

  if (!user) {
    console.log("[WEBHOOK] No user found for subscription:", subscriptionId);
    return;
  }

  await refillProAllowance(user.id);
  console.log(`[WEBHOOK] PRO allowance refilled for user ${user.id}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[WEBHOOK] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
