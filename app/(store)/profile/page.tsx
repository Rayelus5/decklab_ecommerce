import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Package, MapPin, Settings, Crown, BarChart2, ChevronRight, AlertTriangle } from "lucide-react";
import { ProAllowanceBar } from "@/components/profile/pro-allowance-bar";

export const metadata: Metadata = {
  title: "Mi perfil — DECKLAB",
};


export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  const user = await safeQuery(
    () => prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true, email: true, isPro: true, proAllowanceBalance: true,
        proSince: true, isTelegramMember: true, telegramUsername: true,
        proTier: { select: { name: true, monthlyAllowance: true } },
        _count: { select: { orders: true, addresses: true } },
      },
    }),
    null,
    "user.findUnique (profile)"
  );

  if (!user) redirect("/login");

  const balance = Number(user.proAllowanceBalance ?? 0);
  const maxAllowance = Number(user.proTier?.monthlyAllowance ?? 0);

  // Últimos 3 pedidos para el resumen
  const recentOrders = await safeQuery(
    () => prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
    }),
    [],
    "recentOrders.findMany"
  );

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

  const QUICK_LINKS = [
    { href: "/profile/orders", Icon: Package, label: "Mis pedidos", count: user._count.orders },
    { href: "/profile/addresses", Icon: MapPin, label: "Mis direcciones", count: user._count.addresses },
    { href: "/profile/settings", Icon: Settings, label: "Configuración", count: null },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-semibold text-snow">Mi perfil</h1>
        <p className="text-slate-300 text-sm mt-1">{user.email}</p>
      </div>

      {/* Card PRO */}
      {user.isPro && user.proTier ? (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-[16px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {user.proTier.name}
              </span>
            </div>
            <Link
              href="/pricing"
              className="text-xs text-slate-300 hover:text-snow transition-colors"
            >
              Gestionar plan
            </Link>
          </div>
          <ProAllowanceBar balance={balance} max={maxAllowance} />
          {user.proSince && (
            <p className="text-xs text-slate-300/60">
              Miembro PRO desde{" "}
              {new Date(user.proSince).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <BarChart2 size={18} className="text-slate-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-snow">Sin plan PRO</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Suscríbete para acceder a precios exclusivos y allowance mensual.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 bg-ash-50 hover:bg-white text-graphite-700 text-sm font-semibold rounded-[8px] transition-colors"
          >
            Ver planes
          </Link>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ href, Icon, label, count }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between gap-3 bg-graphite-700/40 border border-white/8 hover:border-white/15 rounded-[11px] p-4 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className="text-slate-300" />
              <span className="text-sm font-medium text-snow">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {count !== null && (
                <span className="text-xs text-slate-300 tabular-nums">{count}</span>
              )}
              <ChevronRight size={14} className="text-slate-300/40 group-hover:text-slate-300 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Últimos pedidos */}
      {recentOrders.length > 0 && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-snow">Últimos pedidos</h2>
            <Link
              href="/profile/orders"
              className="text-xs text-slate-300 hover:text-snow transition-colors flex items-center gap-1"
            >
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/8">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/profile/orders/${order.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-white/3 -mx-1 px-1 rounded-[6px] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-snow">
                    Pedido #{order.orderNumber}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
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
          </div>
        </div>
      )}

      {/* Info de cuenta */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-snow">Información de cuenta</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-300">Nombre</p>
            <p className="text-snow mt-0.5">{user.name ?? "No especificado"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Email</p>
            <p className="text-snow mt-0.5 truncate">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Telegram</p>
            <p className={`mt-0.5 ${user.isTelegramMember ? "text-mint-signal" : "text-slate-300/60"}`}>
              {user.telegramUsername
                ? `@${user.telegramUsername}`
                : user.isTelegramMember
                ? "Verificado"
                : "No vinculado"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-300">Estado</p>
            <p className={`mt-0.5 ${user.isPro ? "text-amber-400" : "text-slate-300"}`}>
              {user.isPro ? "PRO activo" : "Cuenta gratuita"}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso no devoluciones */}
      <div className="flex items-start gap-2 text-xs text-slate-300/60">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        <p>
          DECKLAB no realiza devoluciones en ningún producto. Al comprar, aceptas esta política.
        </p>
      </div>
    </div>
  );
}
