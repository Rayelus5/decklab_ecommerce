"use client";

import { Clock } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";

interface ReservationProductBadgeProps {
  badgeText: string;
  closesAt: string;
}

export function ReservationProductBadge({ badgeText, closesAt }: ReservationProductBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-[6px] animate-pro-pulse">
      <Clock size={10} className="text-amber-400 shrink-0" />
      <span className="text-amber-300 font-semibold text-[10px] uppercase tracking-wide">{badgeText}</span>
      <CountdownTimer closesAt={closesAt} compact className="text-amber-300 text-[10px]" />
    </div>
  );
}
