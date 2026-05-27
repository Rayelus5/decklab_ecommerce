"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: number;
}

export function CancelOrderButton({ orderId, orderNumber }: CancelOrderButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const confirmed = window.confirm(
      `¿Cancelar el pedido #${orderNumber}?\n\nSi ya realizaste el pago, se procesará un reembolso automático. El importe tardará 5–10 días hábiles en aparecer en tu cuenta.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "No se pudo cancelar el pedido");
        return;
      }

      toast.success(`Pedido #${orderNumber} cancelado`);
      router.refresh();
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium
        bg-ember-red/10 border border-ember-red/25 text-ember-red
        hover:bg-ember-red/15 hover:border-ember-red/40
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors cursor-pointer"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <XCircle size={14} />
      )}
      {loading ? "Cancelando..." : "Cancelar pedido"}
    </button>
  );
}
