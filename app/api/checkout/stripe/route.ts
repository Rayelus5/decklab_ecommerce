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
    const {
      addressId,
      shippingRateId,
      consolidateOrderId,
      couponCode,
      useProPricing,
      items,
    } = body as {
      addressId: string;
      shippingRateId?: string;
      consolidateOrderId?: string;
      couponCode?: string;
      useProPricing?: boolean;
      items: CartItemInput[];
    };

    if (!addressId || (!shippingRateId && !consolidateOrderId) || !items?.length) {
      return NextResponse.json({ error: "Datos de checkout incompletos" }, { status: 400 });
    }

    // 1. Verificar dirección
    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Dirección no válida" }, { status: 400 });
    }

    // 2a. Verificar shipping rate (rama normal)
    // Declaramos variables que se rellenan por una u otra rama
    let resolvedShippingType: string;
    let resolvedShippingRegion: string;
    let resolvedShippingRateName: string;
    let resolvedBaseShippingCost: number; // coste bruto antes de PRO freeShipping

    // Para la rama de consolidación necesitamos el pedido original
    // (se usa después de cargar las variantes para calcular el cartWeight)
    type ConsolidateInfo = {
      shippingType: string;
      shippingRegion: string;
      shippingCost: number;
      existingWeight: number;
    };
    let consolidateInfo: ConsolidateInfo | null = null;

    if (consolidateOrderId) {
      // Validación preliminar — cargar el pedido original
      const originalOrder = await prisma.order.findFirst({
        where: {
          id: consolidateOrderId,
          userId: session.user.id,
          status: { in: ["PAID", "PROCESSING"] },
        },
        select: {
          shippingType: true,
          shippingRegion: true,
          shippingCost: true,
          items: {
            select: {
              quantity: true,
              variant: { select: { weight: true } },
            },
          },
        },
      });

      if (!originalOrder) {
        return NextResponse.json({ error: "Pedido a consolidar no válido" }, { status: 400 });
      }

      consolidateInfo = {
        shippingType: originalOrder.shippingType,
        shippingRegion: originalOrder.shippingRegion,
        shippingCost: Number(originalOrder.shippingCost),
        existingWeight: originalOrder.items.reduce(
          (sum, item) => sum + item.variant.weight * item.quantity,
          0
        ),
      };

      // Valores provisionales — se sobreescriben en el paso 2b tras cargar variantes
      resolvedShippingType = originalOrder.shippingType;
      resolvedShippingRegion = originalOrder.shippingRegion;
      resolvedShippingRateName = "Envío unificado"; // provisional
      resolvedBaseShippingCost = 0;                  // provisional
    } else {
      // Rama normal
      const shippingRate = await prisma.shippingRate.findUnique({
        where: { id: shippingRateId!, active: true },
      });
      if (!shippingRate) {
        return NextResponse.json({ error: "Método de envío no válido" }, { status: 400 });
      }
      resolvedShippingType = shippingRate.type;
      resolvedShippingRegion = shippingRate.region;
      resolvedShippingRateName = shippingRate.name;
      resolvedBaseShippingCost = Number(shippingRate.price);
    }

    // 3. Verificar y cargar variantes (incluyendo weight para calcular cartWeight)
    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        sku: true,
        title: true,
        price: true,
        pricePro: true,
        proExempt: true,
        stock: true,
        reservedStock: true,
        weight: true,
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

    // 2b. Calcular coste final de envío en la rama de consolidación
    // Ahora que tenemos variants con weight, podemos calcular el cartWeight
    if (consolidateInfo) {
      const cartWeight = items.reduce((sum, item) => {
        const v = variants.find((vv) => vv.id === item.variantId);
        return sum + (v?.weight ?? 0) * item.quantity;
      }, 0);
      const combinedWeight = consolidateInfo.existingWeight + cartWeight;

      // Buscar tarifa — primero en el mismo tipo
      let rate = await prisma.shippingRate.findFirst({
        where: {
          type: consolidateInfo.shippingType,
          region: consolidateInfo.shippingRegion as "NATIONAL" | "EUROPE",
          active: true,
          minWeight: { lte: combinedWeight },
          OR: [{ maxWeight: { gt: combinedWeight } }, { maxWeight: -1 }],
        },
        orderBy: { price: "asc" },
      });

      // Si no existe → buscar en cualquier tipo (más barato disponible)
      if (!rate) {
        rate = await prisma.shippingRate.findFirst({
          where: {
            region: consolidateInfo.shippingRegion as "NATIONAL" | "EUROPE",
            active: true,
            minWeight: { lte: combinedWeight },
            OR: [{ maxWeight: { gt: combinedWeight } }, { maxWeight: -1 }],
          },
          orderBy: { price: "asc" },
        });
      }

      if (!rate) {
        return NextResponse.json(
          { error: "No existe tarifa activa para el peso combinado de este envío" },
          { status: 422 }
        );
      }

      const diff = Math.max(0, Number(rate.price) - consolidateInfo.shippingCost);
      resolvedBaseShippingCost = diff;
      resolvedShippingType = rate.type;
      resolvedShippingRegion = consolidateInfo.shippingRegion;
      resolvedShippingRateName = rate.name;
    }

    // 4. Verificar stock disponible (pre-flight) y reservar atómicamente
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

    // Reservar stock atómicamente
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
      throw err;
    }

    // 5. Determinar precios (PRO vs normal)
    const wantsProPricing = session.user.isPro && (useProPricing !== false);

    const userBalance = wantsProPricing
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { proAllowanceBalance: true },
        })
      : null;

    let remainingAllowance = Number(userBalance?.proAllowanceBalance ?? 0);

    // 6. Construir line items de productos para Stripe
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
        wantsProPricing &&
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
    const proTier =
      session.user.isPro && session.user.proTierId
        ? await prisma.proTier.findUnique({
            where: { id: session.user.proTierId },
            select: { benefits: true },
          })
        : null;

    const benefits = proTier?.benefits as Record<string, unknown> | null;
    const freeShipping = benefits?.freeShipping === true;

    // Si el envío está unificado y la diferencia es 0, freeShipping también aplica
    const effectiveShippingCost = freeShipping ? 0 : resolvedBaseShippingCost;

    if (effectiveShippingCost > 0) {
      const shippingLabel = consolidateOrderId
        ? `Suplemento envío unificado — ${resolvedShippingRateName}`
        : `Envío — ${resolvedShippingRateName}`;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: shippingLabel,
            description: resolvedShippingType,
          },
          unit_amount: Math.round(effectiveShippingCost * 100),
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
        const label =
          validation.coupon.type === "PERCENT"
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
        shippingRateId: shippingRateId ?? "",
        shippingType: resolvedShippingType,
        shippingRegion: resolvedShippingRegion,
        couponCode: couponCode ?? "",
        couponId: couponId ?? "",
        discountAmount: discountAmount.toFixed(2),
        cartItems: JSON.stringify(cartMetaItems),
        isPro: wantsProPricing ? "true" : "false",
        // Campos de consolidación (vacíos si es pedido normal)
        consolidateOrderId: consolidateOrderId ?? "",
        consolidateShippingDiff: consolidateOrderId
          ? effectiveShippingCost.toFixed(2)
          : "",
      },
      locale: "es",
    });

    // 10. Liberar carritos abandonados anteriores del usuario
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
        await prisma
          .$transaction(
            oldItems.map((item) =>
              prisma.$executeRaw`
                UPDATE "ProductVariant"
                SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
                WHERE id = ${item.variantId}
              `
            )
          )
          .catch((err) =>
            console.error("[CHECKOUT] Error releasing old cart reservations:", err)
          );
        stripe.checkout.sessions.expire(oldCart.stripeSessionId).catch(() => {});
        await prisma.abandonedCart.delete({ where: { id: oldCart.id } }).catch(() => {});
      }
    } catch (err) {
      console.error("[CHECKOUT] Error releasing old abandoned carts:", err);
    }

    // 11. Guardar carrito abandonado en BD
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
