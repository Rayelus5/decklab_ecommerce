import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Crown, ShoppingBag, MapPin } from "lucide-react";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Usuario — DECKLAB Admin" };

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-sky-400",
  PROCESSING: "text-amber-400",
  SHIPPED: "text-blue-400",
  DELIVERED: "text-mint-signal",
  CANCELLED: "text-ember-red",
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

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, proTiers] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPro: true,
        isBlocked: true,
        isTelegramMember: true,
        telegramUsername: true,
        telegramId: true,
        proAllowanceBalance: true,
        proTierId: true,
        proSince: true,
        createdAt: true,
        proTier: { select: { name: true, monthlyAllowance: true } },
        addresses: {
          select: { id: true, label: true, line1: true, city: true, country: true, isDefault: true },
          orderBy: { isDefault: "desc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.proTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, monthlyAllowance: true },
    }),
  ]);

  if (!user) notFound();

  const balance = Number(user.proAllowanceBalance ?? 0);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-1.5 rounded-[8px] text-slate-300 hover:text-snow hover:bg-white/6 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-snow">{user.name ?? "Sin nombre"}</h1>
            {user.isPro && <Crown size={16} className="text-amber-400" />}
            {user.role === "ADMIN" && (
              <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">Admin</span>
            )}
          </div>
          <p className="text-slate-300 text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: info cards */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Account info */}
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-snow">Información de cuenta</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-300">Email</p>
                <p className="text-snow mt-0.5">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Telegram</p>
                <p className={`mt-0.5 ${user.isTelegramMember ? "text-mint-signal" : "text-slate-300/50"}`}>
                  {user.telegramUsername ? `@${user.telegramUsername}` : user.isTelegramMember ? "Verificado" : "No vinculado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Registro</p>
                <p className="text-snow mt-0.5">{new Date(user.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Rol</p>
                <p className={`mt-0.5 font-medium ${user.role === "ADMIN" ? "text-amber-400" : "text-snow"}`}>{user.role}</p>
              </div>
              {user.isPro && (
                <>
                  <div>
                    <p className="text-xs text-slate-300">Plan PRO</p>
                    <p className="text-amber-400 mt-0.5 font-medium">{user.proTier?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">Balance allowance</p>
                    <p className="text-snow mt-0.5 tabular-nums">
                      {balance.toFixed(2).replace(".", ",")} &euro;
                      {user.proTier?.monthlyAllowance && (
                        <span className="text-slate-300/60"> / {Number(user.proTier.monthlyAllowance).toFixed(0)} &euro;</span>
                      )}
                    </p>
                  </div>
                  {user.proSince && (
                    <div>
                      <p className="text-xs text-slate-300">Miembro PRO desde</p>
                      <p className="text-snow mt-0.5">{new Date(user.proSince).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
              <ShoppingBag size={14} className="text-slate-300" />
              Pedidos ({user.orders.length})
            </h2>
            {user.orders.length === 0 ? (
              <p className="text-sm text-slate-300/60">Sin pedidos</p>
            ) : (
              <div className="divide-y divide-white/6">
                {user.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-white/3 -mx-1 px-1 rounded-[6px] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-snow">#{order.orderNumber}</p>
                      <p className="text-xs text-slate-300">{new Date(order.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p>
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
            )}
          </div>

          {/* Addresses */}
          {user.addresses.length > 0 && (
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
                <MapPin size={14} className="text-slate-300" />
                Direcciones
              </h2>
              <div className="flex flex-col gap-2">
                {user.addresses.map((addr) => (
                  <div key={addr.id} className="text-xs text-slate-300 flex items-center gap-2">
                    {addr.isDefault && <span className="text-mint-signal font-medium">Pred.</span>}
                    <span className="text-snow">{addr.line1}</span>
                    <span className="text-slate-300/60">{addr.city}, {addr.country}</span>
                    {addr.label && <span className="text-slate-300/40">({addr.label})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: admin actions */}
        <div>
          <UserActions
            userId={user.id}
            currentAllowance={balance}
            isTelegramMember={user.isTelegramMember}
            isPro={user.isPro}
            isBlocked={user.isBlocked}
            proTierId={user.proTierId ?? null}
            proTiers={proTiers.map((t) => ({
              id: t.id,
              name: t.name,
              monthlyAllowance: Number(t.monthlyAllowance),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
