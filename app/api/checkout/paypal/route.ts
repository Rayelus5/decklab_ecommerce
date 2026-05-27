import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { validateCoupon, applyCoupon } from "@/lib/coupon";
import { createPayPalOrder, encodePayload } from "@/lib/paypal";

interface CartItemInput {
  variantId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
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

    // 3. Cargar variantes
    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            isArchived: true,
            categoryId: true,
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json({ error: "Algunas variantes no están disponibles" }, { status: 400 });
    }

    // 4. Verificar stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.stock < item.quantity || variant.product.isArchived) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${variant?.product.title ?? "un producto"}` },
          { status: 400 }
        );
      }
    }

    // 5. Calcular precios (PRO vs normal)
    const userBalance = session.user.isPro
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { proAllowanceBalance: true },
        })
      : null;

    let remainingAllowance = Number(userBalance?.proAllowanceBalance ?? 0);

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
          if (!variant.proExempt) remainingAllowance -= proTotal;
        }
      }

      productSubtotal += pricePaid * item.quantity;
      cartMetaItems.push({ variantId: variant.id, quantity: item.quantity, pricePaid, wasProPrice });
    }

    // 6. Coste de envío (free shipping PRO)
    const proTier = session.user.isPro && session.user.proTierId
      ? await prisma.proTier.findUnique({
          where: { id: session.user.proTierId },
          select: { benefits: true },
        })
      : null;

    const benefits = proTier?.benefits as Record<string, unknown> | null;
    const freeShipping = benefits?.freeShipping === true;
    const shippingCost = !freeShipping && Number(shippingRate.price) > 0
      ? Number(shippingRate.price)
      : 0;

    // 7. Validar cupón
    let couponId = "";
    let discountAmount = 0;

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
        return NextResponse.json(
          { error: validation.error ?? "Cupón no válido" },
          { status: 400 }
        );
      }

      const applied = applyCoupon(productSubtotal, validation.coupon.type, validation.coupon.value);
      discountAmount = applied.discount;
      couponId = validation.coupon.id;
    }

    // 8. Total final
    const total = Math.max(0, productSubtotal + shippingCost - discountAmount);

    // 9. Codificar datos del checkout para pasarlos por la return_url
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const payload = encodePayload({
      userId: session.user.id,
      addressId,
      shippingRateId,
      shippingType: shippingRate.type,
      shippingRegion: shippingRate.region,
      couponCode: couponCode ?? "",
      couponId,
      discountAmount,
      isPro: session.user.isPro,
      cartItems: cartMetaItems,
    });

    // 10. Crear orden en PayPal
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const { orderId, approvalUrl } = await createPayPalOrder({
      total,
      description: `DECKLAB — ${itemCount} artículo${itemCount !== 1 ? "s" : ""}`,
      returnUrl: `${appUrl}/api/checkout/paypal/capture?d=${payload}`,
      cancelUrl: `${appUrl}/checkout?paypal=cancelled`,
    });

    console.log(`[PAYPAL] Orden creada: ${orderId} total: ${total.toFixed(2)} EUR`);

    return NextResponse.json({ url: approvalUrl, orderId });
  } catch (error) {
    console.error("[CHECKOUT PAYPAL]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
