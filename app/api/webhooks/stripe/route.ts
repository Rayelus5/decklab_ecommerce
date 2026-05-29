import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { refillProAllowance } from "@/lib/pro-logic";
import { notifyPurchase } from "@/lib/telegram";
import {
  sendOrderConfirmationEmail,
  sendSubscriptionRenewalEmail,
  sendAbandonedCartEmail,
} from "@/lib/email";

// Deshabilitar el body parser de Next.js para verificar la firma de Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tierId, oldSubscriptionId } = session.metadata ?? {};

  if (!userId || !tierId) {
    console.error("[WEBHOOK] Missing subscription metadata in session:", session.id);
    return;
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : null;

  if (!subscriptionId) {
    console.error("[WEBHOOK] No subscriptionId in subscription session:", session.id);
    return;
  }

  // Idempotencia: si el usuario ya tiene este proSubscriptionId, saltar
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { proSubscriptionId: true, proSince: true },
  });
  if (existing?.proSubscriptionId === subscriptionId) {
    console.log("[WEBHOOK] Subscription already activated:", subscriptionId);
    return;
  }

  const isPlanChange = !!(oldSubscriptionId && oldSubscriptionId !== subscriptionId);

  // Guardar stripeCustomerId si aún no lo tiene (retrocompatibilidad)
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

  // Activar PRO en la BD
  // proSince: se preserva si es un cambio de plan (ya era PRO antes)
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      proTierId: tierId,
      proSubscriptionId: subscriptionId,
      proSince: existing?.proSince ?? new Date(),
      ...(stripeCustomerId && !existing ? { stripeCustomerId } : {}),
    },
  });

  // Cancelar suscripción anterior si es un cambio de plan
  if (isPlanChange) {
    try {
      await stripe.subscriptions.cancel(oldSubscriptionId!);
      console.log(`[WEBHOOK] Old subscription cancelled: ${oldSubscriptionId}`);
    } catch (err) {
      // No bloquear si ya estaba cancelada o no existe
      console.error("[WEBHOOK] Could not cancel old subscription:", oldSubscriptionId, err);
    }
  }

  // Allowance inicial
  // Para cambios de plan: refill con el nuevo tier (el ciclo anterior ya no aplica)
  // Para subscription_create: invoice.paid lo saltará (billing_reason check) así que lo hacemos aquí
  await refillProAllowance(userId);

  console.log(
    isPlanChange
      ? `[WEBHOOK] PRO plan changed for user ${userId}: ${oldSubscriptionId} → ${subscriptionId} (tier ${tierId})`
      : `[WEBHOOK] PRO activated for user ${userId}, tier ${tierId}, sub ${subscriptionId}`
  );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Delegar sesiones de suscripción a su propio handler
  if (session.mode === "subscription") {
    return handleSubscriptionCheckoutCompleted(session);
  }

  const {
    userId, addressId, shippingRateId, shippingType, shippingRegion,
    couponCode, couponId: metaCouponId, discountAmount: metaDiscountAmount,
    cartItems, isPro,
  } = session.metadata ?? {};

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

  // Calcular totales
  const subtotal = parsedItems.reduce((sum, item) => sum + item.pricePaid * item.quantity, 0);
  const shippingCost = Number(shippingRate?.price ?? 0);
  const discountTotal = Number(metaDiscountAmount ?? 0);
  // Usar el total real cobrado por Stripe (evita discrepancias por redondeo)
  const total = session.amount_total != null
    ? session.amount_total / 100
    : Math.max(0, subtotal + shippingCost - discountTotal);

  // Cupón: usar couponId del metadata (ya validado en checkout) para evitar otra query
  let coupon: { id: string; code: string } | null = null;
  if (metaCouponId && couponCode) {
    coupon = { id: metaCouponId, code: couponCode };
  } else if (couponCode && !metaCouponId) {
    // Fallback: buscar por código (compatibilidad con sesiones antiguas)
    const found = await prisma.coupon.findUnique({
      where: { code: couponCode },
      select: { id: true, code: true },
    });
    coupon = found;
  }

  // Guardar stripeCustomerId si aún no lo tiene (retrocompatibilidad con pagos anteriores)
  const stripeCustomerIdPayment = typeof session.customer === "string" ? session.customer : null;
  if (stripeCustomerIdPayment) {
    await prisma.user.updateMany({
      where: { id: userId, stripeCustomerId: null },
      data: { stripeCustomerId: stripeCustomerIdPayment },
    });
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
        discountTotal: discountTotal > 0 ? discountTotal : 0,
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

    // 2. Decrementar stock y liberar reserva de forma idempotente.
    // GREATEST(0, reservedStock - qty) evita que vaya a negativo si la sesión
    // expiró y el webhook de expiración ya liberó la reserva antes de que llegara
    // el pago (edge case de Stripe con sesiones al límite del tiempo).
    for (const item of parsedItems) {
      await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET
          "stock"         = "stock" - ${item.quantity},
          "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
        WHERE id = ${item.variantId}
      `;
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

    // 6. Marcar AbandonedCart como convertido
    await tx.abandonedCart.updateMany({
      where: { stripeSessionId: session.id },
      data: { convertedAt: new Date() },
    });

    return newOrder;
  });

  // 7. Notificar bot de Telegram
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

  // 8. Enviar email de confirmación con factura PDF
  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (err) {
    console.error("[WEBHOOK] Error sending confirmation email:", err);
  }

  console.log(`[WEBHOOK] Order #${order.orderNumber} created for user ${userId}, total: ${total}€`);
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  type CartItem = { variantId: string; quantity: number; pricePaid: number; wasProPrice: boolean };

  const abandonedCart = await prisma.abandonedCart.findUnique({
    where: { stripeSessionId: session.id },
  });

  // Si ya convirtió (pago completado antes de expirar — edge case), no hacer nada
  if (abandonedCart?.convertedAt) {
    console.log("[WEBHOOK] Session already converted, skipping expired handler:", session.id);
    return;
  }

  // Obtener los items del carrito: primero desde AbandonedCart, luego desde
  // el metadata de la sesión de Stripe como fallback de seguridad (en caso de
  // que el registro no se hubiera creado por un error puntual).
  let cartItems: CartItem[] | null = null;

  if (abandonedCart) {
    cartItems = abandonedCart.cartItems as CartItem[];
  } else {
    // Fallback: el metadata del checkout tiene cartItems como JSON
    const raw = session.metadata?.cartItems;
    if (raw) {
      try {
        cartItems = JSON.parse(raw) as CartItem[];
        console.log(`[WEBHOOK] AbandonedCart not found — releasing stock from session metadata: ${session.id}`);
      } catch {
        console.error("[WEBHOOK] Failed to parse cartItems from session metadata:", session.id);
      }
    } else {
      console.error("[WEBHOOK] No cart items found for expired session:", session.id);
    }
  }

  // 1. Liberar reservas de stock de forma idempotente (GREATEST evita negativos)
  if (cartItems?.length) {
    try {
      await prisma.$transaction(
        cartItems.map((item) =>
          prisma.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
            WHERE id = ${item.variantId}
          `
        )
      );
      console.log(`[WEBHOOK] Stock reservations released for expired session: ${session.id}`);
    } catch (err) {
      console.error("[WEBHOOK] Error releasing stock reservations:", err);
    }
  }

  // 2. Enviar email de recuperación (solo si tenemos el AbandonedCart)
  if (abandonedCart && !abandonedCart.recoveryEmailSentAt) {
    try {
      await sendAbandonedCartEmail(
        abandonedCart.userId,
        abandonedCart.cartItems,
        Number(abandonedCart.subtotal)
      );
      await prisma.abandonedCart.update({
        where: { id: abandonedCart.id },
        data: { recoveryEmailSentAt: new Date() },
      });
      console.log(`[WEBHOOK] Recovery email sent for abandoned cart: ${abandonedCart.id}`);
    } catch (err) {
      console.error("[WEBHOOK] Error sending abandoned cart email:", err);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Se dispara cuando el período de una suscripción cancelada expira definitivamente.
  // Revoca el acceso PRO en la BD.
  const user = await prisma.user.findFirst({
    where: { proSubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!user) {
    console.log("[WEBHOOK] No user found for deleted subscription:", subscription.id);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: false,
      proTierId: null,
      proSince: null,
      proSubscriptionId: null,
      proAllowanceBalance: 0,
    },
  });

  console.log(`[WEBHOOK] PRO access revoked for user ${user.id} (subscription ${subscription.id} deleted)`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // "subscription_create" ya lo gestiona handleSubscriptionCheckoutCompleted — evitar doble allowance
  const billingReason = (invoice as unknown as Record<string, unknown>).billing_reason as string | null;
  if (billingReason === "subscription_create") {
    console.log("[WEBHOOK] Skipping refill for subscription_create — handled by checkout.session.completed");
    return;
  }

  // Refill de allowance PRO en renovación de suscripción
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

  // Enviar email de renovación de suscripción
  try {
    await sendSubscriptionRenewalEmail(user.id);
  } catch (err) {
    console.error("[WEBHOOK] Error sending renewal email:", err);
  }

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
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
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
