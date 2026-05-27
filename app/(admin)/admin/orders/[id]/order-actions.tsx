"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
}

export function OrderActions({
  orderId,
  currentStatus,
  currentTracking,
  currentCarrier,
}: OrderActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking ?? "");
  const [carrier, setCarrier] = useState(currentCarrier);
  const [loading, setLoading] = useState(false);

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

      <Button onClick={handleSave} loading={loading}>
        <Save size={14} />
        Guardar cambios
      </Button>
    </div>
  );
}
