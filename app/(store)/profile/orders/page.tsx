import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Package, ChevronRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Mis pedidos — DECKLAB",
};

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
  PENDING: "text-slate-300 bg-slate-300/10",
  PAID: "text-sky-400 bg-sky-400/10",
  PROCESSING: "text-amber-400 bg-amber-400/10",
  SHIPPED: "text-blue-400 bg-blue-400/10",
  DELIVERED: "text-mint-signal bg-mint-signal/10",
  CANCELLED: "text-ember-red bg-ember-red/10",
  REFUNDED: "text-ember-red bg-ember-red/10",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      subtotal: true,
      shippingCost: true,
      discountTotal: true,
      paymentMethod: true,
      createdAt: true,
      _count: { select: { items: true } },
      shipment: { select: { trackingNumber: true, shippedAt: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="p-1.5 rounded-[8px] text-slate-300 hover:text-snow hover:bg-white/6 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-snow">Mis pedidos</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-graphite-600/60 flex items-center justify-center">
            <Package size={22} className="text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-snow">Sin pedidos todavía</p>
            <p className="text-xs text-slate-300 mt-1">
              Cuando realices tu primera compra aparecerá aquí.
            </p>
          </div>
          <Link
            href="/products"
            className="mt-2 px-4 py-2 bg-ash-50 hover:bg-white text-graphite-700 text-sm font-semibold rounded-[8px] transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/profile/orders/${order.id}`}
              className="bg-graphite-700/40 border border-white/8 hover:border-white/15 rounded-[14px] p-5 flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-[10px] bg-graphite-600/60 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-slate-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-snow">
                      Pedido #{order.orderNumber}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "text-slate-300 bg-white/8"}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {" · "}
                    {order._count.items} artículo{order._count.items !== 1 ? "s" : ""}
                    {" · "}
                    {order.paymentMethod === "PAYPAL" ? "PayPal" : "Tarjeta"}
                  </p>
                  {order.shipment?.trackingNumber && (
                    <p className="text-xs text-slate-300/60 mt-1 font-mono">
                      Tracking: {order.shipment.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-snow tabular-nums">
                  {Number(order.total).toFixed(2).replace(".", ",")} &euro;
                </span>
                <ChevronRight
                  size={14}
                  className="text-slate-300/40 group-hover:text-slate-300 transition-colors"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
