/**
 * lib/email.ts — Helper de envío de emails transaccionales
 * Usa Resend + React Email para renderizar y enviar.
 */

import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf";
import { OrderConfirmation } from "@/emails/order-confirmation";
import { ShipmentTracking } from "@/emails/shipment-tracking";
import { SubscriptionRenewal } from "@/emails/subscription-renewal";

// ─────────────────────────────────────────────────────────────────────────────
// Email de confirmación de pedido (con PDF de factura adjunto)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  // Obtener datos del pedido
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
    },
  });

  if (!order || !order.user.email) return;

  // Obtener items en consulta separada (evita inferencia colapsada de Prisma)
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      variant: {
        select: {
          title: true,
          product: { select: { title: true } },
        },
      },
    },
  });

  const orderItems = items.map((item) => ({
    title: item.variant.product.title,
    variantTitle: item.variant.title,
    quantity: item.quantity,
    price: Number(item.pricePaid),
    wasProPrice: item.wasProPrice,
  }));

  const subtotal = Number(order.subtotal);
  const shippingCost = Number(order.shippingCost);
  const discountAmount =
    order.discountTotal && Number(order.discountTotal) > 0
      ? Number(order.discountTotal)
      : undefined;
  const total = Number(order.total);

  const address = {
    line1: order.address?.line1 ?? "",
    line2: order.address?.line2,
    city: order.address?.city ?? "",
    postalCode: order.address?.postalCode ?? "",
    country: order.address?.country ?? "",
  };

  // Renderizar template de email
  const html = await render(
    OrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: order.user.name ?? "Cliente",
      items: orderItems,
      subtotal,
      shippingCost,
      discountAmount,
      couponCode: order.couponCode,
      total,
      shippingMethod: `${order.shippingType} (${order.shippingRegion})`,
      address,
      paymentMethod: order.paymentMethod === "STRIPE" ? "Tarjeta bancaria (Stripe)" : "PayPal",
    })
  );

  // Generar PDF de factura
  const now = new Date(order.createdAt);
  const dateStr = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateInvoicePDF({
      orderNumber: order.orderNumber,
      date: dateStr,
      customerName: order.user.name ?? "Cliente",
      customerEmail: order.user.email,
      address: {
        line1: order.address?.line1 ?? "",
        line2: order.address?.line2,
        city: order.address?.city ?? "",
        postalCode: order.address?.postalCode ?? "",
        country: order.address?.country ?? "",
      },
      items: orderItems.map((i) => ({
        description: i.variantTitle
          ? `${i.title} — ${i.variantTitle}`
          : i.title,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.price * i.quantity,
      })),
      subtotal,
      shippingCost,
      discountAmount,
      couponCode: order.couponCode ?? undefined,
      total,
      paymentMethod: order.paymentMethod === "STRIPE" ? "Tarjeta bancaria (Stripe)" : "PayPal",
    });
  } catch (err) {
    console.error("[EMAIL] Error generating invoice PDF:", err);
  }

  const attachments = pdfBuffer
    ? [
        {
          filename: `factura-decklab-${order.orderNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
    : [];

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.user.email,
    subject: `Pedido confirmado #${order.orderNumber} — DECKLAB SHOP`,
    html,
    attachments,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Email de notificación de envío con tracking
// ─────────────────────────────────────────────────────────────────────────────

export async function sendShipmentTrackingEmail(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      shipment: true,
    },
  });

  if (!order || !order.user.email || !order.shipment?.trackingNumber) return;

  const html = await render(
    ShipmentTracking({
      orderNumber: order.orderNumber,
      customerName: order.user.name ?? "Cliente",
      trackingNumber: order.shipment.trackingNumber,
      carrier: order.shipment.carrier ?? "Correos",
    })
  );

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.user.email,
    subject: `Tu pedido #${order.orderNumber} está de camino — DECKLAB SHOP`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Email de renovación de suscripción PRO
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSubscriptionRenewalEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      proAllowanceBalance: true,
      proTier: {
        select: {
          name: true,
          priceMonthly: true,
        },
      },
    },
  });

  if (!user || !user.email || !user.proTier) return;

  // Próxima renovación: 2 meses desde hoy (ciclo bimestral)
  const nextRenewal = new Date();
  nextRenewal.setMonth(nextRenewal.getMonth() + 2);
  const nextRenewalStr = nextRenewal.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = await render(
    SubscriptionRenewal({
      customerName: user.name ?? "Cliente",
      tierName: user.proTier.name,
      newBalance: Number(user.proAllowanceBalance),
      priceCharged: Number(user.proTier.priceMonthly) * 2, // cobro bimestral
      nextRenewalDate: nextRenewalStr,
    })
  );

  await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: `Suscripción PRO ${user.proTier.name} renovada — DECKLAB SHOP`,
    html,
  });
}
