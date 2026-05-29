"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";

export function ManagePlanButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "No se pudo abrir el portal de Stripe");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-snow disabled:opacity-60 transition-colors"
    >
      {loading
        ? <Loader2 size={12} className="animate-spin" />
        : <ExternalLink size={12} />
      }
      Gestionar plan
    </button>
  );
}
