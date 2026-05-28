"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ReservationCopyButtonProps {
  code: string;
}

export function ReservationCopyButton({ code }: ReservationCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 bg-void-black/60 border border-amber-500/20 rounded-[8px] px-3 py-1.5 cursor-pointer hover:border-amber-500/40 transition-colors group"
    >
      <span className="font-mono text-xs font-semibold text-snow tracking-widest">{code}</span>
      {copied ? (
        <Check size={12} className="text-emerald-400 shrink-0" />
      ) : (
        <Copy size={12} className="text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
      )}
    </button>
  );
}
