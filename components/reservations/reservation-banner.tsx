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
    <div className="w-full mb-8 rounded-[16px] overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-amber-950/60">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        {/* Icono + nombre */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Clock size={15} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Reserva anticipada</p>
            <p className="text-snow font-semibold text-sm truncate">{name}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">Cierra en</span>
          <CountdownTimer closesAt={closesAt} className="text-sm" />
        </div>

        {/* Cupón */}
        {couponCode && (
          <div className="flex items-center gap-2 shrink-0">
            <Tag size={13} className="text-amber-400 shrink-0" />
            {couponLabel && <span className="text-xs text-amber-300">{couponLabel}</span>}
            <div className="flex items-center gap-1.5 bg-void-black/50 border border-amber-500/20 rounded-[8px] px-2.5 py-1">
              <span className="font-mono text-xs font-semibold text-snow tracking-wider">{couponCode}</span>
              <button
                onClick={copyCode}
                aria-label="Copiar código"
                className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        {hasProductFilter && (
          <Link
            href="/products?reservation=true"
            className="ml-auto shrink-0 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
          >
            Ver productos en reserva &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
