import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ShoppingCart, Mail, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { AbandonedCartActions } from "./abandoned-cart-actions";

export const metadata: Metadata = { title: "Carritos abandonados — DECKLAB Admin" };

interface AbandonedCartsPageProps {
  searchParams: Promise<{ converted?: string; page?: string }>;
}

export default async function AbandonedCartsPage({ searchParams }: AbandonedCartsPageProps) {
  const params = await searchParams;
  const showConverted = params.converted === "true";
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (!showConverted) {
    where.convertedAt = null;
  }

  const [carts, total] = await safeQuery(
    () => Promise.all([
      prisma.abandonedCart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          stripeSessionId: true,
          cartItems: true,
          subtotal: true,
          recoveryEmailSentAt: true,
          convertedAt: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.abandonedCart.count({ where }),
    ]),
    [[], 0] as const,
    "admin.abandonedCarts"
  );

  const totalPages = Math.ceil(total / limit);

  // KPIs rápidos
  const [totalAbandoned, totalConverted, todayAbandoned] = await safeQuery(
    () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return Promise.all([
        prisma.abandonedCart.count({ where: { convertedAt: null } }),
        prisma.abandonedCart.count({ where: { convertedAt: { not: null } } }),
        prisma.abandonedCart.count({ where: { convertedAt: null, createdAt: { gte: startOfToday } } }),
      ]);
    },
    [0, 0, 0] as const,
    "admin.abandonedCarts.kpis"
  );

  const conversionRate = totalAbandoned + totalConverted > 0
    ? ((totalConverted / (totalAbandoned + totalConverted)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-snow flex items-center gap-2">
          <ShoppingCart size={20} className="text-slate-300" />
          Carritos abandonados
        </h1>
        <p className="text-slate-300 text-sm mt-1">
          Sesiones de checkout iniciadas pero no completadas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sin convertir", value: totalAbandoned, color: "text-ember-red" },
          { label: "Convertidos", value: totalConverted, color: "text-mint-signal" },
          { label: "Tasa de conversión", value: `${conversionRate}%`, color: "text-sky-400" },
          { label: "Abandonados hoy", value: todayAbandoned, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-graphite-700/40 border border-white/8 rounded-[14px] px-4 py-4"
          >
            <p className="text-xs text-slate-300 mb-1">{label}</p>
            <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/abandoned-carts"
          className={`px-3 py-1.5 rounded-[8px] text-sm transition-colors ${
            !showConverted
              ? "bg-white/8 text-snow font-medium"
              : "text-slate-300 hover:text-snow hover:bg-white/5"
          }`}
        >
          Sin convertir
        </Link>
        <Link
          href="/admin/abandoned-carts?converted=true"
          className={`px-3 py-1.5 rounded-[8px] text-sm transition-colors ${
            showConverted
              ? "bg-white/8 text-snow font-medium"
              : "text-slate-300 hover:text-snow hover:bg-white/5"
          }`}
        >
          Todos
        </Link>
        <span className="text-slate-300/40 text-xs ml-2">{total} resultado{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Tabla */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Usuario
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Items
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Subtotal
                </th>
                <th className="text-center text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Email rec.
                </th>
                <th className="text-center text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Convertido
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Fecha
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 px-4 py-3 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {carts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-300/60 py-12">
                    Sin carritos abandonados en este filtro
                  </td>
                </tr>
              ) : (
                carts.map((cart) => {
                  const items = cart.cartItems as Array<{ variantId: string; quantity: number }>;
                  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={cart.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-snow">{cart.user.name ?? "Sin nombre"}</p>
                        <p className="text-xs text-slate-300 mt-0.5">{cart.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {itemCount} unidad{itemCount !== 1 ? "es" : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-snow tabular-nums">
                        {Number(cart.subtotal).toFixed(2).replace(".", ",")} &euro;
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cart.recoveryEmailSentAt ? (
                          <span title={new Date(cart.recoveryEmailSentAt).toLocaleString("es-ES")}>
                            <Mail size={14} className="text-mint-signal mx-auto" />
                          </span>
                        ) : (
                          <XCircle size={14} className="text-slate-300/30 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cart.convertedAt ? (
                          <span title={new Date(cart.convertedAt).toLocaleString("es-ES")}>
                            <CheckCircle size={14} className="text-mint-signal mx-auto" />
                          </span>
                        ) : (
                          <XCircle size={14} className="text-ember-red/60 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-300">
                        {new Date(cart.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <AbandonedCartActions
                          cartId={cart.id}
                          recoveryEmailSentAt={cart.recoveryEmailSentAt}
                          convertedAt={cart.convertedAt}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/abandoned-carts?page=${p}${showConverted ? "&converted=true" : ""}`}
              className={`w-9 h-9 flex items-center justify-center rounded-[8px] text-sm transition-colors ${
                p === page
                  ? "bg-ash-50 text-graphite-700 font-semibold"
                  : "text-slate-300 hover:text-snow hover:bg-white/5"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={`/admin/abandoned-carts?page=${page + 1}${showConverted ? "&converted=true" : ""}`}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-snow transition-colors ml-2"
            >
              Siguiente <ChevronRight size={12} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
