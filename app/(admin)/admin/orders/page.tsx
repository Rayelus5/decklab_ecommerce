import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ChevronRight, PackagePlus } from "lucide-react";

export const metadata: Metadata = { title: "Pedidos — DECKLAB Admin" };

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status;
  const page = parseInt(sp.page ?? "1");
  const PAGE_SIZE = 20;

  const where = statusFilter ? { status: statusFilter as never } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        consolidatedWithOrderId: true,
        user: { select: { name: true, email: true } },
        _count: { select: { items: true, consolidatedOrders: true } },
        shipment: { select: { trackingNumber: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const STATUS_FILTER_OPTIONS = [
    { label: "Todos", value: "" },
    { label: "Pendiente", value: "PENDING" },
    { label: "Pagado", value: "PAID" },
    { label: "Procesando", value: "PROCESSING" },
    { label: "Enviado", value: "SHIPPED" },
    { label: "Entregado", value: "DELIVERED" },
    { label: "Cancelado", value: "CANCELLED" },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-snow">Pedidos</h1>
          <p className="text-slate-300 text-sm mt-1">{total} pedido{total !== 1 ? "s" : ""} en total</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTER_OPTIONS.map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/admin/orders?status=${value}` : "/admin/orders"}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (statusFilter ?? "") === value
                ? "bg-ash-50 text-graphite-700"
                : "bg-graphite-700/60 border border-white/8 text-slate-300 hover:text-snow"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Pedido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-300">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Fecha</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-300/60">
                    Sin pedidos
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-snow font-semibold">#{order.orderNumber}</span>
                      {order.consolidatedWithOrderId && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-sky-500/12 border border-sky-500/20 text-sky-400 rounded-full font-medium">
                          <PackagePlus size={9} />
                          Unificado
                        </span>
                      )}
                      {order._count.consolidatedOrders > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-sky-500/12 border border-sky-500/20 text-sky-300 rounded-full font-medium">
                          <PackagePlus size={9} />
                          Base ×{order._count.consolidatedOrders}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-snow text-xs">{order.user.name ?? "—"}</p>
                    <p className="text-slate-300/60 text-xs">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "text-slate-300 bg-white/8"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{order._count.items}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {order.paymentMethod === "PAYPAL" ? "PayPal" : "Tarjeta"}
                  </td>
                  <td className="px-4 py-3 text-right text-snow font-semibold tabular-nums">
                    {Number(order.total).toFixed(2).replace(".", ",")} &euro;
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors flex items-center"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs text-slate-300">{total} pedidos</span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/orders?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px] transition-colors"
                >
                  Anterior
                </Link>
              )}
              <span className="text-xs text-slate-300">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link
                  href={`/admin/orders?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px] transition-colors"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
