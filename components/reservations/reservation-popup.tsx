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
    // Solid Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative bg-graphite-800 border-2 border-amber-500 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Solid Top Header */}
        <div className="bg-amber-500 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-black font-black uppercase tracking-widest text-sm">
            <Clock size={18} />
            {reservation.badgeText}
          </div>
          <button
            onClick={dismiss}
            aria-label="Cerrar popup"
            className="text-black/60 hover:text-black transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 relative z-10">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black text-snow uppercase leading-tight mb-1.5">{reservation.name}</h2>
            {reservation.description && (
              <p className="text-slate-300 text-sm">{reservation.description}</p>
            )}
          </div>

          {/* Massive Countdown Block -> Now reasonable size */}
          <div className="bg-graphite-900 border-2 border-graphite-700 rounded-xl p-4 flex flex-col items-center">
            <p className="text-amber-500 font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs mb-1.5 text-center">La oferta termina en</p>
            <CountdownTimer closesAt={reservation.closesAt} compact={true} className="text-3xl sm:text-4xl font-black text-snow font-mono tabular-nums tracking-tighter" />
          </div>

          {/* Info Blocks: Spots & Delivery */}
          <div className="flex flex-col sm:flex-row gap-3">
            {reservation.spotsRemaining != null && (
              <div className="flex-1 bg-graphite-700 rounded-xl p-3 flex flex-col items-center text-center border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Disponibilidad</span>
                <span className={`text-base font-black ${spotsColor}`}>{reservation.spotsRemaining} Plazas</span>
              </div>
            )}
            {reservation.deliveryDate && (
              <div className="flex-1 bg-graphite-700 rounded-xl p-3 flex flex-col items-center text-center border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Envío Estimado</span>
                <span className="text-base font-black text-snow capitalize">
                  {new Date(reservation.deliveryDate).toLocaleDateString("es-ES", { month: "short", year: "numeric" }).replace('.', '')}
                </span>
              </div>
            )}
          </div>

          {/* Coupon Block */}
          {reservation.coupon && (
            <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-4 flex flex-col items-center text-center">
              <p className="text-sm font-bold text-amber-400 mb-3">Usa este código en el carrito y ahorra {discountLabel}</p>
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-2.5 bg-graphite-900 border-2 border-amber-500 hover:border-amber-400 rounded-xl px-5 py-2.5 cursor-pointer transition-colors w-full"
              >
                <span className="font-mono text-lg sm:text-xl font-black text-amber-400 tracking-widest">{reservation.coupon.code}</span>
                {copied ? <Check size={20} className="text-emerald-400 shrink-0" /> : <Copy size={20} className="text-amber-500 shrink-0" />}
              </button>
            </div>
          )}

          {/* Animated Action Button */}
          <button
            onClick={goToProducts}
            className="group relative w-full overflow-hidden rounded-xl mt-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            {/* Base Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
            
            {/* Animated Shine Effect */}
            <div className="absolute top-0 -left-[150%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[30deg] group-hover:translate-x-[200%] transition-transform duration-[1200ms] ease-in-out" />

            {/* Text */}
            <div className="relative py-4 flex items-center justify-center">
              <span className="text-black font-black text-lg sm:text-xl uppercase tracking-widest">
                Aprovechar Oferta
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
