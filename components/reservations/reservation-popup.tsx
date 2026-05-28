"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Copy, Check, Clock, Package, Users } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";

interface ActiveReservation {
  id: string;
  name: string;
  description: string | null;
  closesAt: string;
  deliveryDate: string | null;
  productIds: string[];
  badgeText: string;
  maxUnits: number | null;
  spotsRemaining: number | null;
  coupon: {
    code: string;
    usesCount: number;
    type: string;
    value: number;
  } | null;
}

interface ReservationPopupProps {
  reservation: ActiveReservation;
}

export function ReservationPopup({ reservation }: ReservationPopupProps) {
  const router = useRouter();
  const STORAGE_KEY = `res_popup_${reservation.id}`;

  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Mostrar solo si no se ha descartado en esta sesión
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, [STORAGE_KEY]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function copyCode() {
    if (!reservation.coupon) return;
    try {
      await navigator.clipboard.writeText(reservation.coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  }

  function goToProducts() {
    dismiss();
    router.push("/products?reservation=true");
  }

  const discountLabel =
    reservation.coupon?.type === "PERCENT"
      ? `${Number(reservation.coupon.value).toFixed(0)}% descuento`
      : `${Number(reservation.coupon?.value ?? 0).toFixed(2)} € descuento`;

  const spotsPercent =
    reservation.maxUnits && reservation.spotsRemaining != null
      ? Math.round((reservation.spotsRemaining / reservation.maxUnits) * 100)
      : null;

  const spotsColor =
    spotsPercent == null
      ? "text-slate-300"
      : spotsPercent > 50
      ? "text-emerald-400"
      : spotsPercent > 20
      ? "text-amber-400"
      : "text-red-400";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/75 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative bg-graphite-700 border border-amber-500/25 rounded-[20px] w-full max-w-md shadow-2xl overflow-hidden">
        {/* Franja superior naranja */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Botón cerrar */}
        <button
          onClick={dismiss}
          aria-label="Cerrar popup"
          className="absolute top-4 right-4 text-slate-400 hover:text-snow transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-6 flex flex-col gap-5">
          {/* Cabecera */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 rounded-full text-xs text-amber-400 font-medium mb-3">
              <Clock size={11} />
              {reservation.badgeText}
            </span>
            <h2 className="text-snow font-bold text-lg leading-snug">{reservation.name}</h2>
            {reservation.description && (
              <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">{reservation.description}</p>
            )}
          </div>

          {/* Countdown */}
          <div className="bg-void-black/50 rounded-[12px] p-4 flex flex-col items-center gap-1.5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Cierra en</p>
            <CountdownTimer closesAt={reservation.closesAt} />
          </div>

          {/* Cupón */}
          {reservation.coupon && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400">
                Usa este código en el checkout para obtener el <span className="text-amber-400 font-medium">{discountLabel}</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-void-black/60 border border-white/10 rounded-[10px] px-3 py-2 font-mono text-snow font-semibold tracking-widest text-sm text-center">
                  {reservation.coupon.code}
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-graphite-700 font-semibold text-xs rounded-[10px] transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {/* Plazas */}
          {reservation.spotsRemaining != null && (
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className={spotsColor} />
              <span className={`font-semibold ${spotsColor}`}>
                {reservation.spotsRemaining} plazas restantes
              </span>
              {reservation.coupon && (
                <span className="text-slate-400 text-xs">
                  ({reservation.coupon.usesCount} ya reservados)
                </span>
              )}
            </div>
          )}

          {/* Fecha de entrega */}
          {reservation.deliveryDate && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Package size={13} />
              Entrega estimada:{" "}
              <span className="text-snow font-medium">
                {new Date(reservation.deliveryDate).toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={goToProducts}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-graphite-700 font-bold text-sm rounded-[12px] transition-colors cursor-pointer"
          >
            Ver productos en reserva
          </button>
        </div>
      </div>
    </div>
  );
}
