"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Crown, Users, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TierBenefits {
  earlyAccessHours?: number;
  freeShipping?: boolean;
  exclusiveProducts?: boolean;
  bonusAllowancePercent?: number;
}

interface ProTier {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  monthlyAllowance: number;
  stripePriceId: string;
  benefits: unknown;
  isActive: boolean;
  sortOrder: number;
  _count: { users: number };
}

interface ProTiersManagerProps {
  initialTiers: ProTier[];
}

const EMPTY_BENEFITS: TierBenefits = {
  earlyAccessHours: 0,
  freeShipping: false,
  exclusiveProducts: false,
  bonusAllowancePercent: 0,
};

function parseBenefits(raw: unknown): TierBenefits {
  if (!raw || typeof raw !== "object") return EMPTY_BENEFITS;
  return raw as TierBenefits;
}

function TierForm({
  tier,
  onSubmit,
  onCancel,
  loading,
}: {
  tier?: ProTier;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const benefits = parseBenefits(tier?.benefits);
  const [form, setForm] = useState({
    name: tier?.name ?? "",
    description: tier?.description ?? "",
    priceMonthly: tier?.priceMonthly?.toString() ?? "",
    monthlyAllowance: tier?.monthlyAllowance?.toString() ?? "",
    stripePriceId: tier?.stripePriceId ?? "",
    sortOrder: tier?.sortOrder?.toString() ?? "0",
    isActive: tier?.isActive ?? true,
    earlyAccessHours: benefits.earlyAccessHours?.toString() ?? "0",
    freeShipping: benefits.freeShipping ?? false,
    exclusiveProducts: benefits.exclusiveProducts ?? false,
    bonusAllowancePercent: benefits.bonusAllowancePercent?.toString() ?? "0",
  });

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    onSubmit({
      name: form.name,
      description: form.description || null,
      priceMonthly: parseFloat(form.priceMonthly),
      monthlyAllowance: parseFloat(form.monthlyAllowance),
      stripePriceId: form.stripePriceId,
      sortOrder: parseInt(form.sortOrder),
      isActive: form.isActive,
      benefits: {
        earlyAccessHours: parseInt(form.earlyAccessHours),
        freeShipping: form.freeShipping,
        exclusiveProducts: form.exclusiveProducts,
        bonusAllowancePercent: parseInt(form.bonusAllowancePercent),
      },
    });
  }

  const field = "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

  return (
    <div className="bg-graphite-700/40 border border-white/15 rounded-[16px] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-snow">{tier ? "Editar tier" : "Nuevo tier"}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Nombre</label>
          <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nivel 1" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Orden (sortOrder)</label>
          <input className={field} type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Precio/mes (&euro;)</label>
          <input className={field} type="number" step="0.01" value={form.priceMonthly} onChange={(e) => set("priceMonthly", e.target.value)} placeholder="19.99" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Allowance mensual (&euro;)</label>
          <input className={field} type="number" step="0.01" value={form.monthlyAllowance} onChange={(e) => set("monthlyAllowance", e.target.value)} placeholder="100" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Stripe Price ID</label>
        <input className={field} value={form.stripePriceId} onChange={(e) => set("stripePriceId", e.target.value)} placeholder="price_..." />
      </div>

      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Descripción (opcional)</label>
        <textarea
          className={`${field} resize-none`}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descripción corta del plan"
        />
      </div>

      {/* Benefits */}
      <div className="border border-white/8 rounded-[10px] p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Beneficios (benefits JSON)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Early access (horas)</label>
            <input className={field} type="number" value={form.earlyAccessHours} onChange={(e) => set("earlyAccessHours", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Bonus allowance (%)</label>
            <input className={field} type="number" value={form.bonusAllowancePercent} onChange={(e) => set("bonusAllowancePercent", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.freeShipping} onChange={(e) => set("freeShipping", e.target.checked)} className="w-4 h-4 rounded accent-mint-signal" />
            <span className="text-sm text-slate-300">Envío gratis</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.exclusiveProducts} onChange={(e) => set("exclusiveProducts", e.target.checked)} className="w-4 h-4 rounded accent-mint-signal" />
            <span className="text-sm text-slate-300">Acceso a productos exclusivos</span>
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 rounded accent-mint-signal" />
        <span className="text-sm text-slate-300">Tier activo (visible en pricing)</span>
      </label>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={loading} className="cursor-pointer">
          <Check size={14} />
          {tier ? "Guardar cambios" : "Crear tier"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading} className="cursor-pointer">
          <X size={14} />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ProTiersManager({ initialTiers }: ProTiersManagerProps) {
  const router = useRouter();
  const [tiers, setTiers] = useState(initialTiers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleCreate(data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/pro-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error al crear tier"); return; }
      toast.success("Tier creado");
      setTiers((prev) => [...prev, { ...json, _count: { users: 0 } }]);
      setShowCreate(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/pro-tiers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error al actualizar"); return; }
      toast.success("Tier actualizado");
      setTiers((prev) => prev.map((t) => t.id === id ? { ...t, ...json } : t));
      setEditingId(null);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/pro-tiers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error al eliminar"); return; }
      toast.success("Tier eliminado");
      setTiers((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoadingId(null); }
  }

  return (
    <div className="flex flex-col gap-4">
      {tiers.map((tier) =>
        editingId === tier.id ? (
          <TierForm
            key={tier.id}
            tier={tier}
            onSubmit={(data) => handleUpdate(tier.id, data)}
            onCancel={() => setEditingId(null)}
            loading={formLoading}
          />
        ) : (
          <div key={tier.id} className={`bg-graphite-700/40 border rounded-[14px] p-5 flex items-start justify-between gap-4 ${tier.isActive ? "border-white/8" : "border-white/4 opacity-60"}`}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-amber-500/15 flex items-center justify-center shrink-0">
                <Crown size={16} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-snow">{tier.name}</p>
                  {!tier.isActive && <span className="text-xs text-slate-300/50 border border-white/10 px-1.5 rounded">Inactivo</span>}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {tier.priceMonthly.toFixed(2).replace(".", ",")} &euro;/mes &middot;{" "}
                  {tier.monthlyAllowance.toFixed(0)} &euro; allowance
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300/60">
                  <span className="flex items-center gap-1"><Users size={11} /> {tier._count.users} usuarios</span>
                  <span className="font-mono text-xs">{tier.stripePriceId}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditingId(tier.id)} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-snow hover:bg-white/6 transition-colors">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(tier.id)}
                disabled={loadingId === tier.id || tier._count.users > 0}
                className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-ember-red hover:bg-ember-red/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={tier._count.users > 0 ? "Tiene usuarios activos" : "Eliminar"}
              >
                {loadingId === tier.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        )
      )}

      {showCreate ? (
        <TierForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} />
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/15 hover:border-white/30 rounded-[12px] text-sm text-slate-300 hover:text-snow transition-all"
        >
          <Plus size={14} />
          Añadir tier PRO
        </button>
      )}
    </div>
  );
}
