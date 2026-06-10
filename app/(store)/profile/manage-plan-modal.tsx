"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Crown, Settings, X, ExternalLink, Send, AlertTriangle, Loader2, CheckCircle,
} from "lucide-react";

// Username de Telegram del administrador (sin @)
const ADMIN_TELEGRAM = "rayelus";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ManagePlanModalProps {
  tierName: string;
  proSince: Date | null;
  periodEnd: Date | null;          // null = PRO manual sin suscripción Stripe
  cancelAtPeriodEnd: boolean;
  hasStripeSubscription: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function ManagePlanModal({
  tierName,
  proSince,
  periodEnd,
  cancelAtPeriodEnd: initialCancelAtPeriodEnd,
  hasStripeSubscription,
}: ManagePlanModalProps) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Estado local optimista tras cancelar
  const [isCancelled, setIsCancelled] = useState(initialCancelAtPeriodEnd);
  const [localPeriodEnd, setLocalPeriodEnd] = useState<Date | null>(periodEnd);

  // -------------------------------------------------------------------------
  // Abrir portal de Stripe (historial de facturas)
  // -------------------------------------------------------------------------
  async function handleOpenPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "No se pudo abrir el portal de Stripe");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setPortalLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Confirmar cancelación
  // -------------------------------------------------------------------------
  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      let data: { periodEnd?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }

      if (!res.ok) {
        toast.error(data.error ?? "Error al cancelar la suscripción");
        return;
      }

      // Actualizar estado local para reflejar la cancelación sin recargar
      setIsCancelled(true);
      if (data.periodEnd) setLocalPeriodEnd(new Date(data.periodEnd));
      setShowConfirm(false);
      toast.success("Suscripción cancelada. Tu acceso PRO continuará hasta que expire el período.");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCancelling(false);
    }
  }

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-snow transition-colors"
      >
        <Settings size={12} />
        Gestionar plan
      </button>

      {/* Modal principal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !showConfirm) setOpen(false);
          }}
        >
          <div className="bg-graphite-700 border border-white/10 rounded-[20px] w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-snow">Tu plan PRO</h2>
              </div>
              <button
                onClick={() => { setOpen(false); setShowConfirm(false); }}
                className="p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Datos de la suscripción */}
            <div className="flex flex-col gap-2.5">
              <Row label="Plan" value={tierName} />
              <Row label="Activo desde" value={formatDate(proSince)} />
              <Row
                label={isCancelled ? "Acceso hasta" : "Próxima renovación"}
                value={formatDate(localPeriodEnd)}
              />
            </div>

            {/* Badge de cancelación programada */}
            {isCancelled && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-[8px]">
                <CheckCircle size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  Tu suscripción no se renovará. El acceso PRO expira el {formatDate(localPeriodEnd)}.
                </p>
              </div>
            )}

            {/* Separador */}
            <div className="border-t border-white/8" />

            {/* Panel de confirmación de cancelación */}
            {showConfirm ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Tu acceso PRO continuará activo hasta el{" "}
                    <span className="text-snow font-medium">{formatDate(localPeriodEnd)}</span>.
                    Después no se renovará automáticamente.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-[8px] text-sm text-slate-300 hover:text-snow bg-white/5 hover:bg-white/8 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold bg-ember-red/15 border border-ember-red/30 text-ember-red hover:bg-ember-red/25 disabled:opacity-60 transition-colors"
                  >
                    {cancelling ? <Loader2 size={13} className="animate-spin" /> : null}
                    Sí, cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Enlace al portal de Stripe */}
                {hasStripeSubscription && (
                  <button
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-[8px] text-sm text-slate-300 hover:text-snow bg-white/5 hover:bg-white/8 disabled:opacity-60 transition-colors"
                  >
                    {portalLoading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <ExternalLink size={13} />
                    }
                    Ver historial de pagos en Stripe
                  </button>
                )}

                {/* Cancelar suscripción */}
                {hasStripeSubscription && !isCancelled && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-[8px] text-sm border border-ember-red/25 text-ember-red/80 hover:text-ember-red hover:bg-ember-red/8 transition-colors"
                  >
                    Cancelar suscripción
                  </button>
                )}
              </div>
            )}

            {/* Pie — contacto con admin */}
            <p className="text-xs text-slate-300/50 text-center leading-relaxed">
              ¿Problemas? Escríbenos por privado en Telegram:{" "}
              <a
                href={`https://t.me/${ADMIN_TELEGRAM}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-sky-400 hover:underline inline-flex items-center gap-0.5"
              >
                @{ADMIN_TELEGRAM}
                <Send size={10} className="inline" />
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente de fila de dato
// ---------------------------------------------------------------------------
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-300/70">{label}</span>
      <span className="text-sm text-snow font-medium text-right">{value}</span>
    </div>
  );
}
