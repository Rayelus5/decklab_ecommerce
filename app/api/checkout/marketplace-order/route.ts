import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { validateCoupon, applyCoupon } from "@/lib/coupon";
import { notifyMarketplacePurchase } from "@/lib/telegram";

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
    const { addressId, items, marketplacePlatform, couponCode, useProPricing } = body as {
      addressId: string;
      items: CartItemInput[];
      marketplacePlatform: string;
      couponCode?: string;
      useProPricing?: boolean;
    };

    if (!addressId || !items?.length || !marketplacePlatform) {
      return NextResponse.json({ error: "Datos de checkout incompletos" }, { status: 400 });
    }

    if (!["WALLAPOP", "VINTED"].includes(marketplacePlatform)) {
      return NextResponse.json({ error: "Plataforma no válida" }, { status: 400 });
    }

    // 1. Verificar dirección
    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Dirección no válida" }, { status: 400 });
    }

    const shippingRegion = address.country.toUpperCase() === "ES" ? "NATIONAL" : "EUROPE";

    // 2. Cargar y verificar variantes
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
          select: { id: true, title: true, slug: true, isArchived: true, categoryId: true },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      return NextResponse.json({ error: "Algunas variantes no están disponibles" }, { status: 400 });
    }

    // 3. Verificar stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant || variant.product.isArchived) {
        return NextResponse.json(
          { error: `Producto no disponible: ${variant?.product.title ?? "desconocido"}` },
          { status: 400 }
        );
      }
      const available = variant.stock - variant.reservedStock;
      if (available < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${variant.product.title}". Disponible: ${Math.max(0, available)}.` },
          { status: 409 }
        );
      }
    }

    // 4. Reservar stock atómicamente
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const updated = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = "reservedStock" + ${item.quantity}
            WHERE id = ${item.variantId}
              AND ("stock" - "reservedStock") >= ${item.quantity}
          `;
          if (updated === 0) throw new Error("INSUFFICIENT_STOCK");
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

    // 5. Calcular precios (PRO pricing si aplica)
    const wantsProPricing = session.user.isPro && (useProPricing !== false);
    const userBalance = wantsProPricing
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
    let productName = "";

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      if (!productName) {
        productName = `${variant.product.title}${variant.title ? ` — ${variant.title}` : ""}`;
      }

      const hasProPrice =
        wantsProPricing && variant.pricePro != null && Number(variant.pricePro) > 0;

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

    // 6. Validar cupón
    let couponDbId: string | null = null;
    let discountAmount = 0;
    let couponCodeSnapshot: string | null = null;

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
        // Liberar reservas antes de rechazar
        await prisma.$transaction(
          items.map((item) =>
            prisma.$executeRaw`
              UPDATE "ProductVariant"
              SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
              WHERE id = ${item.variantId}
            `
          )
        ).catch(() => {});
        return NextResponse.json(
          { error: validation.error ?? "Cupón no válido" },
          { status: 400 }
        );
      }

      const applied = applyCoupon(productSubtotal, validation.coupon.type, validation.coupon.value);
      discountAmount = applied.discount;
      couponDbId = validation.coupon.id;
      couponCodeSnapshot = validation.coupon.code;
    }

    // 7. Calcular totales
    const subtotal = productSubtotal;
    const total = Math.max(0, subtotal - discountAmount);

    // 8. Determinar si hubo PRO pricing y cuánto descontar del allowance
    const proDeduction = cartMetaItems
      .filter((i) => {
        const variant = variants.find((v) => v.id === i.variantId);
        return i.wasProPrice && !variant?.proExempt;
      })
      .reduce((sum, i) => sum + i.pricePaid * i.quantity, 0);

    // 9. Crear pedido en una transacción
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          addressId,
          status: "PENDING",
          isPaid: false,
          subtotal,
          total,
          taxTotal: 0,
          shippingCost: 0,
          discountTotal: discountAmount,
          shippingType: marketplacePlatform,
          shippingRegion,
          paymentMethod: "MARKETPLACE",
          couponId: couponDbId ?? undefined,
          couponCode: couponCodeSnapshot ?? undefined,
          marketplaceShipping: true,
          marketplacePlatform,
          marketplacePayOption: "PLATFORM",
          marketplaceListingStatus: "PENDING",
          items: {
            create: cartMetaItems.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              pricePaid: i.pricePaid,
              wasProPrice: i.wasProPrice,
            })),
          },
        },
      });

      // Crear shipment vacío
      await tx.shipment.create({ data: { orderId: createdOrder.id } });

      // Descontar allowance PRO si aplica
      if (proDeduction > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { proAllowanceBalance: { decrement: proDeduction } },
        });
      }

      // Incrementar uso de cupón
      if (couponDbId) {
        await tx.coupon.update({
          where: { id: couponDbId },
          data: { usesCount: { increment: 1 } },
        });
      }

      return createdOrder;
    });

    // 10. Notificar por Telegram (fire-and-forget)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, telegramId: true },
    });

    notifyMarketplacePurchase({
      userName: user?.name ?? session.user.email ?? "Usuario",
      productName: productName || "Varios productos",
      total: total.toFixed(2),
      orderNumber: order.orderNumber,
      platform: marketplacePlatform,
      payOption: "PLATFORM",
      buyerTelegramId: user?.telegramId ?? null,
    }).catch((e) => console.error("[MARKETPLACE ORDER] Telegram error:", e));

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("[MARKETPLACE ORDER]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
