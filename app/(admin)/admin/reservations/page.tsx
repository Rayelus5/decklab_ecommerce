import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Plus, Clock, CheckCircle2, XCircle, Users, Edit2 } from "lucide-react";

export const metadata: Metadata = { title: "Reservas — Admin DECKLAB" };

export default async function AdminReservationsPage() {
  const now = new Date();

  const reservations = await safeQuery(
    () => prisma.reservationPeriod.findMany({
      orderBy: [{ isActive: "desc" }, { closesAt: "asc" }],
      include: {
        coupon: { select: { code: true, usesCount: true, maxUses: true } },
      },
    }),
    [],
    "reservationPeriod.findMany (admin)"
  );

  const activeCount = reservations.filter(
    (r) => r.isActive && r.opensAt <= now && r.closesAt > now
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-snow">Reservas anticipadas</h1>
          <p className="text-slate-300 text-sm mt-0.5">
            {activeCount > 0
              ? `${activeCount} reserva${activeCount !== 1 ? "s" : ""} activa${activeCount !== 1 ? "s" : ""} ahora mismo`
              : "Sin reservas activas ahora mismo"}
          </p>
        </div>
        <Link
          href="/admin/reservations/new"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[10px] transition-colors"
        >
          <Plus size={15} />
          Nueva reserva
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 text-slate-300">
          <Clock size={36} className="mx-auto text-white/15 mb-4" />
          <p>No hay periodos de reserva creados todavía.</p>
          <Link
            href="/admin/reservations/new"
            className="cursor-pointer mt-3 inline-flex items-center gap-1.5 text-sm text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
          >
            <Plus size={13} />
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservations.map((r) => {
            const isOpenNow = r.isActive && r.opensAt <= now && r.closesAt > now;
            const isClosed = r.closesAt <= now;
            const isScheduled = r.isActive && r.opensAt > now;

            const spotsTotal = r.maxUnits;
            const spotsSold = r.coupon?.usesCount ?? 0;
            const spotsLeft = spotsTotal != null ? Math.max(0, spotsTotal - spotsSold) : null;

            return (
              <div
                key={r.id}
                className="bg-graphite-700/40 border border-white/8 rounded-[14px] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Estado */}
                <div className="shrink-0">
                  {isOpenNow ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={11} />
                      Activa
                    </span>
                  ) : isClosed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <XCircle size={11} />
                      Cerrada
                    </span>
                  ) : isScheduled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
                      <Clock size={11} />
                      Programada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      <XCircle size={11} />
                      Inactiva
                    </span>
                  )}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className="text-snow font-semibold text-sm truncate">{r.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {r.opensAt.toLocaleDateString("es-ES")} &rarr; {r.closesAt.toLocaleDateString("es-ES")}
                    {r.deliveryDate && (
                      <> &nbsp;·&nbsp; Entrega: {r.deliveryDate.toLocaleDateString("es-ES")}</>
                    )}
                  </p>
                </div>

                {/* Cupón */}
                {r.coupon && (
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-slate-400">Cupón</p>
                    <p className="text-xs font-mono font-semibold text-snow">{r.coupon.code}</p>
                  </div>
                )}

                {/* Plazas */}
                {spotsTotal != null && (
                  <div className="shrink-0 flex items-center gap-1.5 text-xs">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-snow font-semibold">{spotsSold}</span>
                    <span className="text-slate-400">/ {spotsTotal}</span>
                    {spotsLeft != null && (
                      <span
                        className={
                          spotsLeft > spotsTotal * 0.5
                            ? "text-emerald-400"
                            : spotsLeft > spotsTotal * 0.2
                            ? "text-amber-400"
                            : "text-red-400"
                        }
                      >
                        ({spotsLeft} restantes)
                      </span>
                    )}
                  </div>
                )}

                {/* Productos */}
                <div className="shrink-0 text-xs text-slate-400">
                  {r.productIds.length} producto{r.productIds.length !== 1 ? "s" : ""}
                </div>

                {/* Editar */}
                <Link
                  href={`/admin/reservations/${r.id}`}
                  className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-snow text-xs rounded-[8px] transition-colors"
                >
                  <Edit2 size={12} />
                  Editar
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
