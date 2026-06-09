import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { safeQuery } from "@/lib/safe-query";
import { Package, MapPin, Settings, Crown, BarChart2, ChevronRight, AlertTriangle, Archive, Ticket } from "lucide-react";
import { ProAllowanceBar } from "@/components/profile/pro-allowance-bar";
import { ManagePlanModal } from "./manage-plan-modal";
import { VipCard3D } from "@/components/vip/vip-card-3d";
import { VipInfoModal } from "@/components/vip/vip-info-modal";

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
        proSince: true, proSubscriptionId: true, isTelegramMember: true, telegramUsername: true,
        pokemonedas: true, totalSpent: true, totalOrdersCount: true,
        proTier: { select: { name: true, monthlyAllowance: true } },
        vipTier: true, vipTierId: true,
        _count: { select: { orders: true, addresses: true } },
      },
    }),
    null,
    "user.findUnique (profile)"
  );

  if (!user) redirect("/login");

  const balance = Number(user.proAllowanceBalance ?? 0);
  const maxAllowance = Number(user.proTier?.monthlyAllowance ?? 0);

  // Datos de la suscripción Stripe (server-side, sin llamada del cliente)
  const [subscriptionPeriodEnd, cancelAtPeriodEnd, vipTiers] = await Promise.all([
    safeQuery(async () => {
      if (!user.proSubscriptionId) return null;
      const sub = await stripe.subscriptions.retrieve(user.proSubscriptionId);
      return new Date((sub.items.data[0]?.current_period_end || 0) * 1000);
    }),
    safeQuery(async () => {
      if (!user.proSubscriptionId) return false;
      const sub = await stripe.subscriptions.retrieve(user.proSubscriptionId);
      return sub.cancel_at_period_end;
    }),
    safeQuery(() => prisma.vipTier.findMany({ orderBy: { level: "asc" } })),
  ]);

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
    { href: "/profile/inventory", Icon: Archive, label: "Mis cajas", count: null },
    { href: "/profile/orders", Icon: Package, label: "Mis pedidos", count: user._count.orders },
    { href: "/profile/addresses", Icon: MapPin, label: "Mis direcciones", count: user._count.addresses },
    { href: "/profile/settings", Icon: Settings, label: "Configuración", count: null },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-snow">Mi perfil</h1>
          <p className="text-slate-300 text-sm mt-1">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* VIP Button */}
          <VipInfoModal 
            tiers={vipTiers || []} 
            userTierId={user.vipTierId} 
            totalSpent={Number(user.totalSpent || 0)} 
            totalOrdersCount={user.totalOrdersCount || 0} 
          />

          {/* Pokemonedas */}
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black text-xs font-bold border border-amber-300 shadow-sm">
              ₽
            </div>
            <span className="text-amber-400 font-bold">{user.pokemonedas.toLocaleString()}</span>
            <span className="text-amber-500/80 text-sm font-medium hidden sm:inline">Pokemonedas</span>
          </div>
        </div>
      </div>

      {/* Tarjeta VIP 3D */}
      {user.vipTier && (
        <div className="w-full flex justify-center my-4">
          <VipCard3D
            level={user.vipTier.level}
            name={user.vipTier.name}
            color={user.vipTier.color}
            iconImage={user.vipTier.iconImage}
            userName={user.name || "CLIENTE VIP"}
            memberSince={user.proSince}
          />
        </div>
      )}

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
            <ManagePlanModal
              tierName={user.proTier.name}
              proSince={user.proSince}
              periodEnd={subscriptionPeriodEnd}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              hasStripeSubscription={!!user.proSubscriptionId}
            />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ href, Icon, label, count }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-3 bg-graphite-700/40 border border-white/8 hover:border-white/15 rounded-[11px] p-4 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Icon size={20} className="text-slate-300" />
              {count !== null && (
                <span className="text-xs font-semibold text-slate-300 tabular-nums bg-white/10 px-2 py-0.5 rounded-full">{count}</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium text-snow">{label}</span>
              <ChevronRight size={14} className="text-slate-300/40 group-hover:text-slate-300 transition-colors" />
            </div>
          </Link>
        ))}
        {/* Enlace a Promociones */}
        <Link
          href="/promotion"
          className="col-span-1 sm:col-span-2 md:col-span-4 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-[11px] p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Ticket size={20} className="text-amber-500" />
            <div>
              <span className="text-sm font-medium text-amber-500">Canjear Código Promocional</span>
              <p className="text-xs text-amber-500/70">Consigue huevos Pokémon y recompensas exclusivas.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
        </Link>
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
