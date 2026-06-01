"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PackagePlus,
  Unlink,
  Link2,
  Loader2,
  Package,
  Scale,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackingGroupMember {
  id: string;
  orderNumber: number;
  isCurrentOrder: boolean;
  isBase: boolean;
  shippingCost: number;
  items: {
    title: string;
    variantTitle: string | null;
    quantity: number;
    weight: number;
  }[];
  totalWeight: number;
}

interface ConsolidationManagerProps {
  orderId: string;
  orderNumber: number;
  // null = este pedido no tiene consolidación en ninguna dirección
  consolidatedWithOrder: { id: string; orderNumber: number } | null;
  packingGroup: PackingGroupMember[]; // incluye este pedido
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ConsolidationManager({
  orderId,
  orderNumber,
  consolidatedWithOrder,
  packingGroup,
}: ConsolidationManagerProps) {
  const router = useRouter();

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkInput, setLinkInput] = useState("");      // ID del pedido base
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(true);

  const hasConsolidation = packingGroup.length > 1;
  const combinedWeight = packingGroup.reduce((s, m) => s + m.totalWeight, 0);

  // ── Vincular ──────────────────────────────────────────────────────────────
  async function handleLink() {
    const trimmed = linkInput.trim();
    if (!trimmed) {
      toast.error("Introduce el ID del pedido base");
      return;
    }

    setLinking(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/consolidation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consolidateWithOrderId: trimmed }),
      });
      const data: { error?: string } = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al vincular pedidos");
        return;
      }

      toast.success(`Pedido #${orderNumber} vinculado correctamente`);
      setShowLinkForm(false);
      setLinkInput("");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLinking(false);
    }
  }

  // ── Desvincular ───────────────────────────────────────────────────────────
  async function handleUnlink() {
    setUnlinking(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/consolidation`, {
        method: "DELETE",
      });
      const data: { error?: string } = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al desvincular");
        return;
      }

      toast.success("Consolidación eliminada");
      setShowConfirmUnlink(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setUnlinking(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PackagePlus size={15} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-snow">Envío unificado</h2>
          {hasConsolidation && (
            <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/15 border border-sky-500/25 text-sky-400 rounded-full font-semibold">
              {packingGroup.length} pedidos · {(combinedWeight / 1000).toFixed(2)}kg
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botón desvincular (solo si es pedido secundario) */}
          {consolidatedWithOrder && !showConfirmUnlink && (
            <button
              onClick={() => setShowConfirmUnlink(true)}
              className="inline-flex items-center gap-1.5 text-xs text-ember-red/70 hover:text-ember-red transition-colors"
            >
              <Unlink size={12} />
              Desvincular
            </button>
          )}
          {/* Botón vincular (solo si no tiene consolidación como secundario) */}
          {!consolidatedWithOrder && (
            <button
              onClick={() => setShowLinkForm((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-snow transition-colors"
            >
              <Link2 size={12} />
              {showLinkForm ? "Cancelar" : "Vincular con pedido"}
            </button>
          )}
        </div>
      </div>

      {/* Confirmación de desvinculación */}
      {showConfirmUnlink && (
        <div className="flex items-start gap-3 bg-ember-red/8 border border-ember-red/20 rounded-[10px] p-3">
          <AlertTriangle size={14} className="text-ember-red shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-ember-red font-medium">
              ¿Desvincular del Pedido #{consolidatedWithOrder?.orderNumber}?
            </p>
            <p className="text-xs text-slate-300/70 mt-0.5">
              El pedido volverá a tener envío independiente. Esta acción no afecta al pago ya realizado.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => setShowConfirmUnlink(false)}
                className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/8 text-slate-300 hover:text-snow rounded-[6px] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-ember-red/15 border border-ember-red/30 text-ember-red hover:bg-ember-red/25 rounded-[6px] disabled:opacity-60 transition-colors"
              >
                {unlinking && <Loader2 size={11} className="animate-spin" />}
                Sí, desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de vinculación */}
      {showLinkForm && (
        <div className="flex flex-col gap-2.5 bg-white/3 border border-white/8 rounded-[10px] p-3">
          <p className="text-xs text-slate-300/70 leading-relaxed">
            Introduce el <span className="text-snow font-medium">ID de base de datos</span> del pedido
            con el que quieres unificar este envío. El pedido indicado actuará como pedido base.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ID del pedido base (ej: clx1a2b3c...)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              className="flex-1 bg-white/4 border border-white/8 rounded-[7px] px-3 py-2 text-xs text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 transition-colors font-mono"
            />
            <button
              onClick={handleLink}
              disabled={linking || !linkInput.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-snow hover:bg-white text-graphite-700 text-xs font-semibold rounded-[7px] disabled:opacity-50 transition-colors"
            >
              {linking ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Vincular
            </button>
          </div>
          <p className="text-[10px] text-slate-300/40">
            Puedes copiar el ID desde la URL del pedido base: /admin/orders/<span className="text-slate-300/60">[ID]</span>
          </p>
        </div>
      )}

      {/* Vista de grupo de empaquetado */}
      {hasConsolidation ? (
        <div className="flex flex-col gap-3">
          {/* Toggle expandir/colapsar */}
          <button
            onClick={() => setGroupExpanded((v) => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Scale size={13} className="text-slate-300/60" />
              <span className="text-xs font-medium text-slate-300">
                Contenido de la bolsa — {combinedWeight}g total
              </span>
            </div>
            {groupExpanded
              ? <ChevronUp size={13} className="text-slate-300/50" />
              : <ChevronDown size={13} className="text-slate-300/50" />
            }
          </button>

          {groupExpanded && (
            <div className="flex flex-col gap-2">
              {packingGroup.map((member) => (
                <div
                  key={member.id}
                  className={[
                    "border rounded-[10px] overflow-hidden",
                    member.isCurrentOrder
                      ? "border-white/15 bg-white/3"
                      : "border-white/8 bg-transparent",
                  ].join(" ")}
                >
                  {/* Cabecera del miembro */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
                    <div className="flex items-center gap-2">
                      <Package size={12} className="text-slate-300/60 shrink-0" />
                      <Link
                        href={`/admin/orders/${member.id}`}
                        className="text-xs font-semibold text-snow hover:text-ash-50 transition-colors"
                      >
                        Pedido #{member.orderNumber}
                        {member.isCurrentOrder && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-white/10 text-slate-300 rounded-[3px] font-normal">
                            este pedido
                          </span>
                        )}
                        {member.isBase && !member.isCurrentOrder && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-sky-500/15 text-sky-400 rounded-[3px] font-normal">
                            base
                          </span>
                        )}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-300/60">
                      <span>{member.totalWeight}g</span>
                      {member.shippingCost > 0 ? (
                        <span>+{member.shippingCost.toFixed(2)} € supl.</span>
                      ) : (
                        <span className="text-mint-signal">sin supl.</span>
                      )}
                    </div>
                  </div>

                  {/* Ítems del pedido */}
                  <div className="divide-y divide-white/4">
                    {member.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                        <span className="text-slate-300 truncate flex-1 pr-2">
                          {item.title}
                          {item.variantTitle && (
                            <span className="text-slate-300/50"> — {item.variantTitle}</span>
                          )}
                        </span>
                        <span className="text-slate-300/60 tabular-nums shrink-0">
                          ×{item.quantity} · {item.weight * item.quantity}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Resumen total */}
              <div className="flex items-center justify-between px-3 py-2 bg-white/3 border border-white/8 rounded-[8px] text-xs">
                <span className="text-slate-300/70">Peso total de la bolsa</span>
                <span className="font-semibold text-snow">{combinedWeight}g ({(combinedWeight / 1000).toFixed(3)}kg)</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-300/50">
          Este pedido no está unificado con ningún otro. Puedes vincularlo manualmente usando el botón de arriba.
        </p>
      )}
    </div>
  );
}
