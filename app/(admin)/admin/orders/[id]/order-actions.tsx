"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagado" },
  { value: "PROCESSING", label: "Procesando" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "REFUNDED", label: "Reembolsado" },
];

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  currentTracking: string | null;
  currentCarrier: string;
  stripePaymentIntentId?: string | null;
}

export function OrderActions({
  orderId,
  currentStatus,
  currentTracking,
  currentCarrier,
  stripePaymentIntentId,
}: OrderActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking ?? "");
  const [carrier, setCarrier] = useState(currentCarrier);
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const canRefund =
    (currentStatus === "PAID" || currentStatus === "PROCESSING") &&
    !!stripePaymentIntentId;

  async function handleNotify() {
    setNotifyLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify-telegram`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al notificar por Telegram");
        return;
      }
      toast.success("Notificación enviada por Telegram");
    } catch {
      toast.error("Error de conexión al notificar");
    } finally {
      setNotifyLoading(false);
    }
  }

  async function handleRefund() {
    const confirmed = window.confirm(
      "¿Emitir reembolso completo para este pedido?\n\nSe procesará en Stripe y el cliente recibirá el importe en 5–10 días hábiles. Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setRefundLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al procesar el reembolso");
        return;
      }
      toast.success("Reembolso procesado correctamente");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setRefundLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: tracking || undefined,
          carrier: carrier || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al actualizar el pedido");
        return;
      }
      toast.success("Pedido actualizado correctamente");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-snow">Gestionar pedido</h2>

      {/* Status */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Estado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow focus:outline-none focus:border-white/25 transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Carrier */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Transportista</label>
        <input
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="CORREOS"
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {/* Tracking */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Número de tracking</label>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Ej: ES123456789ES"
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow font-mono placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      <Button onClick={handleSave} loading={loading} className="cursor-pointer">
        <Save size={14} />
        Guardar cambios
      </Button>

      <Button onClick={handleNotify} loading={notifyLoading} variant="outline" className="cursor-pointer mt-2 text-slate-300 border-white/10 hover:bg-white/5">
        Notificar estado por Telegram
      </Button>

      {canRefund && (
        <>
          <hr className="border-white/8" />
          <div>
            <p className="text-xs text-slate-300 mb-2">
              Reembolso completo vía Stripe. Restaura el stock y el saldo PRO si aplica.
            </p>
            <button
              onClick={handleRefund}
              disabled={refundLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-sm font-medium
                bg-ember-red/10 border border-ember-red/25 text-ember-red
                hover:bg-ember-red/15 hover:border-ember-red/40
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors cursor-pointer"
            >
              {refundLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              {refundLoading ? "Procesando..." : "Emitir reembolso"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
