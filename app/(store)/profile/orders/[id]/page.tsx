import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CreditCard,
  Crown,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import { CancelOrderButton } from "@/components/profile/cancel-order-button";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(_: OrderDetailPageProps): Promise<Metadata> {
  return { title: "Pedido — DECKLAB" };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de pago",
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

const STEPS = [
  { key: "PENDING", label: "Realizado" },
  { key: "PAID", label: "Pago" },
  { key: "PROCESSING", label: "Preparando" },
  { key: "SHIPPED", label: "Enviado" },
  { key: "DELIVERED", label: "Entregado" },
];
const STEP_ORDER = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/profile/orders/${id}`);

  // Fetch order scalars + direct relations
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      address: true,
      shipment: true,
      consolidatedWith: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  // Fetch items separately to avoid deep-nesting TypeScript inference issues
  const items = await prisma.orderItem.findMany({
    where: { orderId: id },
    include: {
      variant: {
        select: {
          title: true,
          product: {
            select: {
              title: true,
              slug: true,
              images: {
                select: { url: true },
                orderBy: { position: "asc" as const },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const currentStepIndex = STEP_ORDER.indexOf(order.status);
  const isTerminal = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile/orders"
          className="cursor-pointer p-1.5 rounded-[8px] text-slate-300 hover:text-snow hover:bg-white/6 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-snow">
              Pedido #{order.orderNumber}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] ?? "text-slate-300 bg-white/8 border-white/10"}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            {new Date(order.createdAt).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Marketplace — banner informativo */}
      {order.marketplaceShipping && order.marketplacePlatform && (
        <div className={`border rounded-[12px] px-4 py-4 flex flex-col gap-3 ${
          order.marketplacePlatform === "WALLAPOP"
            ? "bg-orange-500/8 border-orange-500/20"
            : "bg-emerald-500/8 border-emerald-500/20"
        }`}>
          <div className="flex items-center gap-2">
            <Truck size={14} className={order.marketplacePlatform === "WALLAPOP" ? "text-orange-400 shrink-0" : "text-emerald-400 shrink-0"} />
            <p className={`text-sm font-semibold ${order.marketplacePlatform === "WALLAPOP" ? "text-orange-300" : "text-emerald-300"}`}>
              Envío por {order.marketplacePlatform === "WALLAPOP" ? "Wallapop" : "Vinted"}
            </p>
          </div>
          {order.marketplacePayOption === "PLATFORM" && order.status === "PENDING" ? (
            <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-1">
              <p>Tu pedido está registrado. El equipo de DECKLAB creará un anuncio en{" "}
                <strong className="text-snow">{order.marketplacePlatform === "WALLAPOP" ? "Wallapop" : "Vinted"}</strong>{" "}
                y te lo enviará por Telegram en breve.</p>
              <p className="text-slate-300/60">No necesitas hacer nada más hasta recibirlo.</p>
            </div>
          ) : order.marketplacePayOption === "WEB" ? (
            <div className="text-xs text-slate-300 leading-relaxed">
              <p>Has pagado los productos aquí. El equipo creará un anuncio de <strong className="text-snow">1€</strong>{" "}
              en {order.marketplacePlatform === "WALLAPOP" ? "Wallapop" : "Vinted"} para que puedas comprar el envío con seguimiento de Correos.</p>
            </div>
          ) : null}
          {order.marketplaceListingUrl && (
            <a
              href={order.marketplaceListingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 ${
                order.marketplacePlatform === "WALLAPOP" ? "text-orange-300 hover:text-orange-100" : "text-emerald-300 hover:text-emerald-100"
              } transition-colors`}
            >
              <ExternalLink size={12} />
              {order.marketplacePayOption === "WEB" ? "Comprar envío en el anuncio" : "Ver anuncio en la plataforma"}
            </a>
          )}
        </div>
      )}

      {/* Envío unificado — banner informativo */}
      {order.consolidatedWith && (
        <div className="bg-sky-500/8 border border-sky-500/20 rounded-[12px] px-4 py-3 flex items-center gap-3">
          <Truck size={14} className="text-sky-400 shrink-0" />
          <p className="text-xs text-sky-300">
            Este pedido se envía junto al{" "}
            <Link
              href={`/profile/orders/${order.consolidatedWith.id}`}
              className="cursor-pointer font-semibold underline underline-offset-2 hover:text-sky-100 transition-colors"
            >
              Pedido #{order.consolidatedWith.orderNumber}
            </Link>{" "}
            (envío unificado). Solo se cobra la diferencia de tarifa.
          </p>
        </div>
      )}

      {/* Progress tracker */}
      {!isTerminal && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5">
          <div className="flex items-start justify-between gap-1">
            {STEPS.map((step, i) => {
              const isCompleted = currentStepIndex >= i;
              const isActive = currentStepIndex === i;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-center">
                    {i > 0 && (
                      <div
                        className={`absolute right-1/2 left-0 h-0.5 ${
                          currentStepIndex >= i ? "bg-mint-signal" : "bg-white/10"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 mx-auto w-3 h-3 rounded-full border-2 transition-colors ${
                        isActive
                          ? "bg-mint-signal border-mint-signal ring-2 ring-mint-signal/30"
                          : isCompleted
                          ? "bg-mint-signal border-mint-signal"
                          : "bg-graphite-600 border-white/20"
                      }`}
                    />
                    {i < STEPS.length - 1 && (
                      <div
                        className={`absolute left-1/2 right-0 h-0.5 ${
                          currentStepIndex > i ? "bg-mint-signal" : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs text-center leading-tight ${
                      isCompleted ? "text-snow font-medium" : "text-slate-300/60"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.shipment?.trackingNumber && (
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-[16px] p-5 flex items-start gap-3">
          <Truck size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-snow">Información de envío</p>
            <p className="text-xs text-slate-300 mt-1">
              Transportista: {order.shipment.carrier}
            </p>
            <p className="text-xs font-mono text-slate-300 mt-0.5">
              Tracking: {order.shipment.trackingNumber}
            </p>
            {order.shipment.shippedAt && (
              <p className="text-xs text-slate-300/60 mt-1">
                Enviado el{" "}
                {new Date(order.shipment.shippedAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            <a
              href="https://www.correos.es/ss/Satellite/site/pagina-inicio/info"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Rastrear en Correos <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
          <Package size={14} className="text-slate-300" />
          Artículos
        </h2>
        <div className="flex flex-col divide-y divide-white/8">
          {items.map((item) => {
            const imageUrl = item.variant.product.images[0]?.url;
            return (
              <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="w-12 h-12 rounded-[8px] bg-graphite-600/60 overflow-hidden shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={item.variant.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff size={14} className="text-slate-300/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.variant.product.slug}`}
                    className="cursor-pointer text-sm font-medium text-snow hover:text-ash-50 transition-colors truncate block"
                  >
                    {item.variant.product.title}
                  </Link>
                  {item.variant.title && (
                    <p className="text-xs text-slate-300 mt-0.5">{item.variant.title}</p>
                  )}
                  {item.wasProPrice && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                      <Crown size={10} />
                      Precio PRO
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-snow tabular-nums">
                    {Number(item.pricePaid).toFixed(2).replace(".", ",")} &euro;
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">&times; {item.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel order */}
      {(order.status === "PENDING" || order.status === "PAID") && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-snow">Cancelar pedido</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Solo puedes cancelar mientras el pedido no haya pasado a estado Preparando.
            {order.status === "PAID" && " Al cancelar se emitirá un reembolso automático."}
          </p>
          <CancelOrderButton orderId={order.id} orderNumber={order.orderNumber} />
        </div>
      )}

      {/* Summary & Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Totals */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
            <CreditCard size={14} className="text-slate-300" />
            Resumen del pago
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Subtotal</span>
              <span className="text-snow tabular-nums">
                {Number(order.subtotal).toFixed(2).replace(".", ",")} &euro;
              </span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">
                  Descuento
                  {order.couponCode && (
                    <span className="ml-1 text-xs font-mono text-mint-signal">
                      ({order.couponCode})
                    </span>
                  )}
                </span>
                <span className="text-mint-signal tabular-nums">
                  -{Number(order.discountTotal).toFixed(2).replace(".", ",")} &euro;
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-300">
                {order.marketplaceShipping
                  ? `Envío (${order.marketplacePlatform === "WALLAPOP" ? "Wallapop" : "Vinted"})`
                  : `Envío (${order.shippingType.toLowerCase()})`}
              </span>
              <span className="text-snow tabular-nums">
                {Number(order.shippingCost) === 0
                  ? order.marketplaceShipping ? "En plataforma" : "Gratis"
                  : `${Number(order.shippingCost).toFixed(2).replace(".", ",")} €`}
              </span>
            </div>
            <div className="pt-2 border-t border-white/8 flex justify-between">
              <span className="font-semibold text-snow">Total</span>
              <span className="font-bold text-snow tabular-nums">
                {Number(order.total).toFixed(2).replace(".", ",")} &euro;
              </span>
            </div>
            <p className="text-xs text-slate-300 pt-1">
              Pagado con{" "}
              <span className="text-snow font-medium">
                {order.paymentMethod === "PAYPAL" ? "PayPal" : "Tarjeta"}
              </span>
            </p>
          </div>
        </div>

        {/* Address */}
        {order.address && (
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
              <MapPin size={14} className="text-slate-300" />
              Dirección de entrega
            </h2>
            <div className="text-sm text-slate-300 flex flex-col gap-0.5">
              {order.address.label && (
                <p className="text-snow font-medium text-xs uppercase tracking-wide mb-1">
                  {order.address.label}
                </p>
              )}
              <p className="text-snow">{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.postalCode} {order.address.city}
                {order.address.province ? `, ${order.address.province}` : ""}
              </p>
              <p>{order.address.country}</p>
              <p className="mt-1 text-xs">{order.address.phone}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
