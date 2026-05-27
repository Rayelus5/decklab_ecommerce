import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

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
      include: { product: { select: { title: true, slug: true, isArchived: true } } },
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
            description: variant.sku,
          },
          unit_amount: Math.round(pricePaid * 100), // centavos
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

    if (!freeShipping && Number(shippingRate.price) > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Envío — ${shippingRate.name}`,
            description: shippingRate.type,
          },
          unit_amount: Math.round(Number(shippingRate.price) * 100),
        },
        quantity: 1,
      });
    }

    // 8. Crear sesión de Stripe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${appUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        addressId,
        shippingRateId,
        shippingType: shippingRate.type,
        shippingRegion: shippingRate.region,
        couponCode: couponCode ?? "",
        cartItems: JSON.stringify(cartMetaItems),
        isPro: session.user.isPro ? "true" : "false",
      },
      locale: "es",
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("[CHECKOUT STRIPE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
