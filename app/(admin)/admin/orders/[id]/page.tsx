import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Crown, ImageOff, MapPin, CreditCard } from "lucide-react";
import { OrderActions } from "./order-actions";
import { ConsolidationManager, type PackingGroupMember } from "./consolidation-manager";

export const metadata: Metadata = { title: "Pedido — DECKLAB Admin" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-slate-300 bg-slate-300/10 border-slate-300/20",
  PAID: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  PROCESSING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  SHIPPED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  DELIVERED: "text-mint-signal bg-mint-signal/10 border-mint-signal/20",
  CANCELLED: "text-ember-red bg-ember-red/10 border-ember-red/20",
  REFUNDED: "text-ember-red bg-ember-red/10 border-ember-red/20",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, telegramUsername: true, isPro: true } },
      address: true,
      shipment: true,
      coupon: { select: { code: true, type: true, value: true } },
      consolidatedWith: { select: { id: true, orderNumber: true } },
      consolidatedOrders: { select: { id: true, orderNumber: true, shippingCost: true } },
    },
  });

  if (!order) notFound();

  // ── Build packing group ───────────────────────────────────────────────────
  // Find all orders that belong to the same consolidation group as this one.
  // A group = base order + all its secondaries.
  const baseOrderId = order.consolidatedWithOrderId ?? order.id;

  // Load all group members with their items (for weight/content display)
  const groupOrders = await prisma.order.findMany({
    where: {
      OR: [
        { id: baseOrderId },
        { consolidatedWithOrderId: baseOrderId },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      shippingCost: true,
      consolidatedWithOrderId: true,
      items: {
        select: {
          quantity: true,
          variant: {
            select: {
              weight: true,
              title: true,
              product: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  const packingGroup: PackingGroupMember[] = groupOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    isCurrentOrder: o.id === order.id,
    isBase: o.consolidatedWithOrderId === null,
    shippingCost: Number(o.shippingCost),
    totalWeight: o.items.reduce((s, i) => s + i.variant.weight * i.quantity, 0),
    items: o.items.map((i) => ({
      title: i.variant.product.title,
      variantTitle: i.variant.title ?? null,
      quantity: i.quantity,
      weight: i.variant.weight,
    })),
  }));

  const items = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: {
      variant: {
        select: {
          sku: true,
          title: true,
          product: {
            select: {
              title: true,
              slug: true,
              images: { select: { url: true }, orderBy: { position: "asc" as const }, take: 1 },
            },
          },
        },
      },
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="p-1.5 rounded-[8px] text-slate-300 hover:text-snow hover:bg-white/6 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-snow">Pedido #{order.orderNumber}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] ?? "text-slate-300 bg-white/8 border-white/10"}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            {new Date(order.createdAt).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* ── Envío unificado — gestión admin ── */}
      <ConsolidationManager
        orderId={order.id}
        orderNumber={order.orderNumber}
        consolidatedWithOrder={order.consolidatedWith ?? null}
        packingGroup={packingGroup}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Items */}
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-snow">Artículos</h2>
            <div className="divide-y divide-white/8">
              {items.map((item) => {
                const img = item.variant.product.images[0]?.url;
                return (
                  <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-[7px] bg-graphite-600/60 flex items-center justify-center shrink-0 overflow-hidden">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={item.variant.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff size={13} className="text-slate-300/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-snow truncate">{item.variant.product.title}</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {item.variant.title && `${item.variant.title} · `}
                        <span className="font-mono">{item.variant.sku}</span>
                      </p>
                      {item.wasProPrice && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                          <Crown size={10} /> PRO
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-snow tabular-nums">
                        {Number(item.pricePaid).toFixed(2).replace(".", ",")} &euro;
                      </p>
                      <p className="text-xs text-slate-300">&times; {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
              <CreditCard size={14} className="text-slate-300" />
              Resumen financiero
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-snow tabular-nums">{Number(order.subtotal).toFixed(2).replace(".", ",")} &euro;</span>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    Descuento {order.couponCode && <span className="font-mono text-mint-signal">({order.couponCode})</span>}
                  </span>
                  <span className="text-mint-signal tabular-nums">
                    -{Number(order.discountTotal).toFixed(2).replace(".", ",")} &euro;
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-300">Envío ({order.shippingType})</span>
                <span className="text-snow tabular-nums">
                  {Number(order.shippingCost) === 0 ? "Gratis" : `${Number(order.shippingCost).toFixed(2).replace(".", ",")} €`}
                </span>
              </div>
              <div className="pt-2 border-t border-white/8 flex justify-between font-semibold">
                <span className="text-snow">Total</span>
                <span className="text-snow tabular-nums">{Number(order.total).toFixed(2).replace(".", ",")} &euro;</span>
              </div>
              <p className="text-xs text-slate-300 pt-1">
                Método: <span className="text-snow">{order.paymentMethod === "PAYPAL" ? "PayPal" : "Tarjeta"}</span>
              </p>
              {order.stripePaymentIntentId && (
                <p className="text-xs text-slate-300/60 font-mono break-all">{order.stripePaymentIntentId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions + user + address */}
        <div className="flex flex-col gap-5">
          {/* Order management */}
          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            currentTracking={order.shipment?.trackingNumber ?? null}
            currentCarrier={order.shipment?.carrier ?? "CORREOS"}
            stripePaymentIntentId={order.stripePaymentIntentId}
          />

          {/* User */}
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-snow">Cliente</h2>
            <div className="text-sm flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-snow">{order.user.name ?? "Sin nombre"}</p>
                {order.user.isPro && <Crown size={13} className="text-amber-400" />}
              </div>
              <p className="text-xs text-slate-300">{order.user.email}</p>
              {order.user.telegramUsername && (
                <p className="text-xs text-slate-300/60">@{order.user.telegramUsername}</p>
              )}
              <Link
                href={`/admin/users/${order.user.id}`}
                className="text-xs text-slate-300 hover:text-snow transition-colors mt-1"
              >
                Ver perfil completo →
              </Link>
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
                <MapPin size={14} className="text-slate-300" />
                Dirección de envío
              </h2>
              <div className="text-sm text-slate-300 flex flex-col gap-0.5">
                {order.address.label && <p className="text-snow font-medium text-xs uppercase tracking-wide mb-1">{order.address.label}</p>}
                <p className="text-snow">{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.postalCode} {order.address.city}{order.address.province ? `, ${order.address.province}` : ""}</p>
                <p>{order.address.country}</p>
                <p className="text-xs mt-1">{order.address.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
