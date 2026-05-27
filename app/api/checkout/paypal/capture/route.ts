import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder, decodePayload } from "@/lib/paypal";
import { notifyPurchase } from "@/lib/telegram";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * GET /api/checkout/paypal/capture
 *
 * PayPal redirige aquí después de que el usuario aprueba el pago.
 * Query params que envía PayPal:
 *   token     → PayPal Order ID
 *   PayerID   → ID del comprador en PayPal
 *   d         → Checkout payload (base64url, codificado por nosotros)
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { searchParams } = new URL(req.url);

  const paypalOrderId = searchParams.get("token");
  const encodedData = searchParams.get("d");

  if (!paypalOrderId || !encodedData) {
    return NextResponse.redirect(`${appUrl}/checkout?paypal=error&reason=missing_params`);
  }

  // Decodificar el payload del checkout
  let payload;
  try {
    payload = decodePayload(encodedData);
  } catch {
    console.error("[PAYPAL CAPTURE] Error decodificando payload");
    return NextResponse.redirect(`${appUrl}/checkout?paypal=error&reason=invalid_payload`);
  }

  // Idempotencia: verificar si ya existe un pedido con este paypalOrderId
  const existing = await prisma.order.findFirst({
    where: { paypalOrderId },
    select: { id: true, orderNumber: true },
  });
  if (existing) {
    console.log(`[PAYPAL CAPTURE] Orden ya procesada: ${paypalOrderId}`);
    return NextResponse.redirect(`${appUrl}/order-success?paypal_order_id=${paypalOrderId}`);
  }

  // Capturar el pago en PayPal
  let captureResult;
  try {
    captureResult = await capturePayPalOrder(paypalOrderId);
  } catch (err) {
    console.error("[PAYPAL CAPTURE] Error al capturar pago:", err);
    return NextResponse.redirect(`${appUrl}/checkout?paypal=error&reason=capture_failed`);
  }

  if (captureResult.status !== "COMPLETED") {
    console.error(`[PAYPAL CAPTURE] Estado inesperado: ${captureResult.status}`);
    return NextResponse.redirect(`${appUrl}/checkout?paypal=error&reason=not_completed`);
  }

  const {
    userId, addressId, shippingRateId, shippingType, shippingRegion,
    couponCode, couponId, discountAmount, isPro, cartItems,
  } = payload;

  // Cargar datos necesarios para el pedido
  const [shippingRate, variants] = await Promise.all([
    prisma.shippingRate.findUnique({
      where: { id: shippingRateId },
      select: { price: true },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: cartItems.map((i) => i.variantId) } },
      select: { id: true, stock: true, proExempt: true },
    }),
  ]);

  // Calcular totales (el total real lo da PayPal, evitamos discrepancias)
  const subtotal = cartItems.reduce((sum, i) => sum + i.pricePaid * i.quantity, 0);
  const shippingCost = Number(shippingRate?.price ?? 0);
  const total = captureResult.amountCaptured; // Importe real capturado por PayPal

  // Cupón: resolver desde BD si hay couponId
  let coupon: { id: string; code: string } | null = null;
  if (couponId && couponCode) {
    coupon = { id: couponId, code: couponCode };
  } else if (couponCode && !couponId) {
    const found = await prisma.coupon.findUnique({
      where: { code: couponCode },
      select: { id: true, code: true },
    });
    coupon = found;
  }

  // Transacción atómica: crear pedido + decrementar stock + descontar allowance + marcar cupón
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Crear pedido
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          paypalOrderId,
          paymentMethod: "PAYPAL",
          status: "PAID",
          isPaid: true,
          shippingType: shippingType ?? "ORDINARIO",
          shippingRegion: shippingRegion ?? "NATIONAL",
          shippingCost,
          subtotal,
          discountTotal: discountAmount > 0 ? discountAmount : 0,
          total,
          couponId: coupon?.id ?? null,
          couponCode: coupon ? couponCode : null,
          items: {
            create: cartItems.map((item) => {
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

      // Decrementar stock
      for (const item of cartItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Descontar allowance PRO
      if (isPro) {
        const proDeduction = cartItems.reduce((sum, item) => {
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

      // Incrementar usos del cupón
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usesCount: { increment: 1 } },
        });
      }

      // Crear shipment vacío
      await tx.shipment.create({
        data: { orderId: newOrder.id },
      });

      return newOrder;
    });
  } catch (err) {
    console.error("[PAYPAL CAPTURE] Error en transacción DB:", err);
    // El pago YA está capturado en PayPal — no redirigir a error de checkout
    // porque el dinero ha salido. Redirigir a soporte.
    return NextResponse.redirect(
      `${appUrl}/order-success?paypal_order_id=${paypalOrderId}&db_error=1`
    );
  }

  // Notificaciones (no bloquean la redirección)
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, telegramId: true },
    });

    const firstItem = cartItems[0];
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
    console.error("[PAYPAL CAPTURE] Error notificando Telegram:", err);
  }

  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (err) {
    console.error("[PAYPAL CAPTURE] Error enviando email:", err);
  }

  console.log(`[PAYPAL] Pedido #${order.orderNumber} creado — total: ${total.toFixed(2)} EUR`);

  return NextResponse.redirect(
    `${appUrl}/order-success?paypal_order_id=${paypalOrderId}`
  );
}
