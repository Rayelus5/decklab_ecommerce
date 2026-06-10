"use client";

import { Clock, Copy, Check, Tag } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CountdownTimer } from "./countdown-timer";

interface ReservationBannerProps {
  id: string;
  name: string;
  closesAt: string;
  couponCode?: string;
  couponLabel?: string; // "15% descuento" | "5€ descuento"
  hasProductFilter: boolean; // true si hay productIds para filtrar
}

export function ReservationBanner({
  name,
  closesAt,
  couponCode,
  couponLabel,
  hasProductFilter,
}: ReservationBannerProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!couponCode) return;
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <div className="w-full mb-8 bg-amber-500/5 border border-amber-500/20 rounded-[16px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Icon & Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Reserva Anticipada</p>
          <h3 className="text-snow font-bold text-sm leading-tight">{name}</h3>
        </div>
      </div>

      {/* Details & Actions */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Countdown */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Cierra en</span>
          <CountdownTimer closesAt={closesAt} className="text-sm font-bold text-snow" />
        </div>

        {/* Cupón */}
        {couponCode && (
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{couponLabel || "Cupón"}</span>
            <button onClick={copyCode} className="flex items-center gap-1.5 group cursor-pointer">
              <span className="font-mono text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">{couponCode}</span>
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500 group-hover:text-amber-300" />}
            </button>
          </div>
        )}

        {/* CTA */}
        {hasProductFilter && (
          <Link
            href="/products?reservation=true"
            className="cursor-pointer ml-auto md:ml-0 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Ver Colección
          </Link>
        )}
      </div>
    </div>
  );
}
