"use client";

import { motion } from "framer-motion";

interface ProAllowanceBarProps {
  balance: number;
  max: number;
}

export function ProAllowanceBar({ balance, max }: ProAllowanceBarProps) {
  const pct = max > 0 ? Math.min(100, (balance / max) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">Crédito disponible</span>
        <span className="text-snow font-semibold tabular-nums">
          {balance.toFixed(2).replace(".", ",")} / {max.toFixed(0)} &euro;
        </span>
      </div>
      <div
        className="h-2 bg-graphite-500 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={balance}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Crédito PRO: ${balance.toFixed(2)} de ${max.toFixed(0)} euros`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}
