import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { StatsCard } from "@/components/admin/stats-card";
import { ShoppingBag, Users, Crown, AlertTriangle, ChevronRight, TrendingUp, ShoppingCart, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard — DECKLAB Admin" };

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
  PENDING: "text-slate-300",
  PAID: "text-sky-400",
  PROCESSING: "text-amber-400",
  SHIPPED: "text-blue-400",
  DELIVERED: "text-mint-signal",
  CANCELLED: "text-ember-red",
  REFUNDED: "text-ember-red",
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrdersToday,
    salesToday,
    salesMonth,
    pendingOrders,
    proUsers,
    totalUsers,
    lowStockVariants,
    recentOrders,
    abandonedCartsToday,
    activeReservationsCount,
  ] = await safeQuery(
    () => Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday }, isPaid: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfToday }, isPaid: true }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: startOfMonth }, isPaid: true }, _sum: { total: true } }),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
      prisma.user.count({ where: { isPro: true } }),
      prisma.user.count(),
      prisma.productVariant.findMany({
        where: { stock: { gt: 0, lte: 5 } },
        select: { sku: true, stock: true, product: { select: { title: true } } },
        take: 5,
        orderBy: { stock: "asc" },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true, orderNumber: true, status: true, total: true, createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.abandonedCart.count({ where: { createdAt: { gte: startOfToday }, convertedAt: null } }),
      prisma.reservationPeriod.count({ where: { isActive: true, opensAt: { lte: now }, closesAt: { gt: now } } }),
    ]),
    [0, { _sum: { total: null } }, { _sum: { total: null } }, 0, 0, 0, [], [], 0, 0] as const,
    "admin dashboard"
  );

  const todaySales = Number(salesToday._sum.total ?? 0);
  const monthSales = Number(salesMonth._sum.total ?? 0);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Dashboard</h1>
        <p className="text-slate-300 text-sm mt-1">
          {now.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Ventas hoy"
          value={`${todaySales.toFixed(2).replace(".", ",")} €`}
          subtitle={`${totalOrdersToday} pedido${totalOrdersToday !== 1 ? "s" : ""}`}
          icon={TrendingUp}
          accent="mint"
        />
        <StatsCard
          title="Ventas este mes"
          value={`${monthSales.toFixed(2).replace(".", ",")} €`}
          icon={ShoppingBag}
          accent="blue"
        />
        <StatsCard
          title="Usuarios PRO"
          value={proUsers}
          subtitle={`de ${totalUsers} usuarios totales`}
          icon={Crown}
          accent="amber"
        />
        <StatsCard
          title="Pedidos pendientes"
          value={pendingOrders}
          subtitle="Pagados o en proceso"
          icon={AlertTriangle}
          accent={pendingOrders > 0 ? "red" : "default"}
        />
        <StatsCard
          title="Carritos abandonados hoy"
          value={abandonedCartsToday}
          subtitle={abandonedCartsToday > 0 ? "Sin convertir" : "Sin abandono hoy"}
          icon={ShoppingCart}
          accent={abandonedCartsToday > 0 ? "amber" : "default"}
        />
        <StatsCard
          title="Reservas activas"
          value={activeReservationsCount}
          subtitle={activeReservationsCount > 0 ? "Abiertas ahora" : "Sin reservas abiertas"}
          icon={Clock}
          accent={activeReservationsCount > 0 ? "amber" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-snow">Últimos pedidos</h2>
            <Link href="/admin/orders" className="text-xs text-slate-300 hover:text-snow flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/6">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-white/3 -mx-1 px-1 rounded-[6px] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-snow">
                    #{order.orderNumber}{" "}
                    <span className="text-slate-300 font-normal text-xs">
                      — {order.user.name ?? order.user.email}
                    </span>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {order._count.items} art.{" "}
                    &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${STATUS_COLORS[order.status] ?? "text-slate-300"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-sm font-semibold text-snow tabular-nums">
                    {Number(order.total).toFixed(2).replace(".", ",")} &euro;
                  </span>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-sm text-slate-300/60 py-4 text-center">Sin pedidos todavía</p>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-snow">Stock bajo</h2>
            <Link href="/admin/products" className="text-xs text-slate-300 hover:text-snow flex items-center gap-1 transition-colors">
              Ver <ChevronRight size={12} />
            </Link>
          </div>
          {lowStockVariants.length === 0 ? (
            <p className="text-sm text-slate-300/60 text-center py-4">Sin alertas de stock</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lowStockVariants.map((v) => (
                <div key={v.sku} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-snow truncate">{v.product.title}</p>
                    <p className="text-xs text-slate-300/60 font-mono">{v.sku}</p>
                  </div>
                  <span className={`text-xs font-bold tabular-nums shrink-0 ${v.stock <= 2 ? "text-ember-red" : "text-amber-400"}`}>
                    {v.stock} ud.
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-white/8">
            <Link href="/admin/products" className="text-xs text-slate-300 hover:text-snow transition-colors flex items-center gap-1">
              Gestionar productos <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/products/new", label: "Nuevo producto" },
          { href: "/admin/reservations/new", label: "Nueva reserva" },
          { href: "/admin/abandoned-carts", label: "Carritos abandonados" },
          { href: "/admin/coupons", label: "Gestionar cupones" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="bg-graphite-700/40 border border-white/8 hover:border-white/15 rounded-[12px] px-4 py-3 text-sm text-slate-300 hover:text-snow transition-all flex items-center justify-between gap-2"
          >
            {label}
            <ChevronRight size={13} className="shrink-0 opacity-50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
