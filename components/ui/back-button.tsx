"use client";

import { ArrowLeft } from "lucide-react";

export function BackButton({ label = "Volver atrás" }: { label?: string }) {
  return (
    <button
      onClick={() => history.back()}
      className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-snow transition-colors"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
}
