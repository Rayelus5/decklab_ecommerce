import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customer";
import { rateLimit } from "@/lib/rate-limit";
import { validateCoupon, applyCoupon } from "@/lib/coupon";

interface CartItemInput {
  variantId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 intentos de checkout por usuario por minuto
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rl = rateLimit(`checkout:${session.user.id}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { addressId, shippingRateId, couponCode, items } = body as {
      addressId: string;
      shippingRateId: string;
      couponCode?: string;
      items: CartItemInput[];
    };

    if (!addressId || !shippingRateId || !items?.length) {
      return NextResponse.json({ error: "Datos de checkout incompletos" }, { status: 400 });
    }

    // 1. Verificar dirección
    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Dirección no válida" }, { status: 400 });
    }

    // 2. Verificar shipping rate
    const shippingRate = await prisma.shippingRate.findUnique({
      where: { id: shippingRateId, active: true },
    });
    if (!shippingRate) {
      return NextResponse.json({ error: "Método de envío no válido" }, { status: 400 });
    }

    // 3. Verificar y cargar variantes
    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            isArchived: true,
            categoryId: true,
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json({ error: "Algunas variantes no están disponibles" }, { status: 400 });
    }

    // 4. Verificar stock disponible (pre-flight) y reservar atómicamente
    // Pre-flight: evitar crear sesiones condenadas antes de llamar a Stripe
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.product.isArchived) {
        return NextResponse.json(
          { error: `Producto no disponible: ${variant?.product.title ?? "desconocido"}` },
          { status: 400 }
        );
      }
      const availableStock = variant.stock - variant.reservedStock;
      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${variant.product.title}". Disponible: ${Math.max(0, availableStock)}.` },
          { status: 409 }
        );
      }
    }

    // Reservar stock atómicamente — si algún item falla (race condition), rollback completo
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const updated = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = "reservedStock" + ${item.quantity}
            WHERE id = ${item.variantId}
              AND ("stock" - "reservedStock") >= ${item.quantity}
          `;
          if (updated === 0) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }
      });
    } catch (err) {
      if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { error: "Uno o más productos se agotaron mientras procesabas el pedido. Actualiza tu carrito." },
          { status: 409 }
        );
      }
      throw err; // Relanzar errores inesperados
    }

    // 5. Determinar precios (PRO vs normal)
    const userBalance = session.user.isPro
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { proAllowanceBalance: true },
        })
      : null;

    let remainingAllowance = Number(userBalance?.proAllowanceBalance ?? 0);

    // 6. Construir line items para Stripe
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    const cartMetaItems: Array<{
      variantId: string;
      quantity: number;
      pricePaid: number;
      wasProPrice: boolean;
    }> = [];

    let productSubtotal = 0;

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const hasProPrice =
        session.user.isPro &&
        variant.pricePro != null &&
        Number(variant.pricePro) > 0;

      let pricePaid = Number(variant.price);
      let wasProPrice = false;

      if (hasProPrice) {
        const proTotal = Number(variant.pricePro!) * item.quantity;
        if (variant.proExempt || remainingAllowance >= proTotal) {
          pricePaid = Number(variant.pricePro!);
          wasProPrice = true;
          if (!variant.proExempt) {
            remainingAllowance -= proTotal;
          }
        }
      }

      productSubtotal += pricePaid * item.quantity;

      cartMetaItems.push({
        variantId: variant.id,
        quantity: item.quantity,
        pricePaid,
        wasProPrice,
      });

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${variant.product.title}${variant.title ? ` — ${variant.title}` : ""}`,
            description: variant.sku ?? undefined,
          },
          unit_amount: Math.round(pricePaid * 100),
        },
        quantity: item.quantity,
      });
    }

    // 7. Añadir envío como line item
    const proTier = session.user.isPro && session.user.proTierId
      ? await prisma.proTier.findUnique({
          where: { id: session.user.proTierId },
          select: { benefits: true },
        })
      : null;

    const benefits = proTier?.benefits as Record<string, unknown> | null;
    const freeShipping = benefits?.freeShipping === true;

    const shippingCost = (!freeShipping && Number(shippingRate.price) > 0)
      ? Number(shippingRate.price)
      : 0;

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Envío — ${shippingRate.name}`,
            description: shippingRate.type,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // 8. Validar cupón y crear cupón temporal en Stripe (si hay)
    let couponId: string | null = null;
    let discountAmount = 0;
    let stripeCouponId: string | undefined;

    if (couponCode?.trim()) {
      const cartProductIds = variants.map((v) => v.product.id);
      const cartCategoryIds = variants
        .map((v) => v.product.categoryId)
        .filter((id): id is string => Boolean(id));

      const validation = await validateCoupon(
        couponCode,
        session.user.id,
        productSubtotal,
        cartProductIds,
        cartCategoryIds
      );

      if (!validation.valid || !validation.coupon) {
        // Liberar reservas si el cupón falla
        await releaseStockReservations(items);
        return NextResponse.json(
          { error: validation.error ?? "Cupón no válido" },
          { status: 400 }
        );
      }

      const applied = applyCoupon(
        productSubtotal,
        validation.coupon.type,
        validation.coupon.value
      );

      discountAmount = applied.discount;
      couponId = validation.coupon.id;

      if (discountAmount > 0) {
        const label = validation.coupon.type === "PERCENT"
          ? `${validation.coupon.value}% — ${validation.coupon.code}`
          : `${discountAmount.toFixed(2)}€ — ${validation.coupon.code}`;

        const stripeCoupon = await stripe.coupons.create({
          name: `Descuento ${label}`,
          amount_off: Math.round(discountAmount * 100),
          currency: "eur",
          duration: "once",
        });

        stripeCouponId = stripeCoupon.id;
      }
    }

    // 9. Crear sesión de Stripe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Reutilizar el cliente de Stripe existente (evita duplicados)
    const stripeCustomerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${appUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      customer: stripeCustomerId,
      metadata: {
        userId: session.user.id,
        addressId,
        shippingRateId,
        shippingType: shippingRate.type,
        shippingRegion: shippingRate.region,
        couponCode: couponCode ?? "",
        couponId: couponId ?? "",
        discountAmount: discountAmount.toFixed(2),
        cartItems: JSON.stringify(cartMetaItems),
        isPro: session.user.isPro ? "true" : "false",
      },
      locale: "es",
    });

    // 10. Liberar carritos abandonados anteriores del usuario (sesiones antiguas sin pagar)
    // Esto evita que múltiples reservas de stock se acumulen por reinicios de checkout.
    try {
      const oldCarts = await prisma.abandonedCart.findMany({
        where: {
          userId: session.user.id,
          convertedAt: null,
          stripeSessionId: { not: stripeSession.id },
        },
        select: { id: true, stripeSessionId: true, cartItems: true },
      });

      for (const oldCart of oldCarts) {
        const oldItems = oldCart.cartItems as Array<{ variantId: string; quantity: number }>;
        await prisma.$transaction(
          oldItems.map((item) =>
            prisma.$executeRaw`
              UPDATE "ProductVariant"
              SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
              WHERE id = ${item.variantId}
            `
          )
        ).catch((err) =>
          console.error("[CHECKOUT] Error releasing old cart reservations:", err)
        );
        stripe.checkout.sessions.expire(oldCart.stripeSessionId).catch(() => {});
        await prisma.abandonedCart.delete({ where: { id: oldCart.id } }).catch(() => {});
      }
    } catch (err) {
      console.error("[CHECKOUT] Error releasing old abandoned carts:", err);
    }

    // 11. Guardar carrito abandonado en BD (se marca como convertido en el webhook al pagar)
    try {
      await prisma.abandonedCart.upsert({
        where: { stripeSessionId: stripeSession.id },
        create: {
          userId: session.user.id,
          stripeSessionId: stripeSession.id,
          cartItems: cartMetaItems as never,
          subtotal: productSubtotal,
        },
        update: {},
      });
    } catch (err) {
      // No bloquear el checkout si falla el registro del carrito abandonado
      console.error("[CHECKOUT] Error creating AbandonedCart:", err);
    }

    return NextResponse.json({ url: stripeSession.url, sessionId: stripeSession.id });
  } catch (error) {
    console.error("[CHECKOUT STRIPE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// Helper — Liberar reservas de stock
// -------------------------------------------------------
async function releaseStockReservations(items: CartItemInput[]) {
  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.$executeRaw`
          UPDATE "ProductVariant"
          SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
          WHERE id = ${item.variantId}
        `
      )
    );
  } catch (err) {
    console.error("[CHECKOUT] Error releasing stock reservations:", err);
  }
}
