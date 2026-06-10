"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usesCount: number;
  maxUsesPerUser: number | null;
  expiresAt: Date | string | null;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
  createdAt: Date | string;
}

interface CouponsManagerProps {
  initialCoupons: Coupon[];
}

const field = "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

function CouponForm({
  coupon,
  onSubmit,
  onCancel,
  loading,
}: {
  coupon?: Coupon;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    type: coupon?.type ?? "PERCENT",
    value: coupon?.value?.toString() ?? "",
    minOrderAmount: coupon?.minOrderAmount?.toString() ?? "",
    maxUses: coupon?.maxUses?.toString() ?? "",
    maxUsesPerUser: coupon?.maxUsesPerUser?.toString() ?? "",
    expiresAt: coupon?.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
      : "",
    isActive: coupon?.isActive ?? true,
  });

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSubmit() {
    onSubmit({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    });
  }

  return (
    <div className="bg-graphite-700/40 border border-white/15 rounded-[14px] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-snow">{coupon ? "Editar cupón" : "Nuevo cupón"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Código</label>
          <input className={`${field} uppercase font-mono`} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="DECKLAB20" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Tipo</label>
          <select className={field} value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="PERCENT">Porcentaje (%)</option>
            <option value="FIXED">Fijo (&euro;)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Valor ({form.type === "PERCENT" ? "%" : "€"})</label>
          <input className={field} type="number" step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.type === "PERCENT" ? "20" : "10.00"} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Pedido mínimo (&euro;, opcional)</label>
          <input className={field} type="number" step="0.01" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="Sin mínimo" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Usos máximos globales</label>
          <input className={field} type="number" value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="Ilimitado" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Usos por usuario</label>
          <input className={field} type="number" value={form.maxUsesPerUser} onChange={(e) => set("maxUsesPerUser", e.target.value)} placeholder="Ilimitado" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Fecha de expiración</label>
          <input className={field} type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 rounded accent-mint-signal" />
        <span className="text-sm text-slate-300">Cupón activo</span>
      </label>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={loading} className="cursor-pointer"><Check size={14} />{coupon ? "Guardar" : "Crear cupón"}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading} className="cursor-pointer"><X size={14} />Cancelar</Button>
      </div>
    </div>
  );
}

export function CouponsManager({ initialCoupons }: CouponsManagerProps) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleCreate(data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Cupón creado");
      setCoupons((p) => [json, ...p]);
      setShowCreate(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Cupón actualizado");
      setCoupons((p) => p.map((c) => c.id === id ? json : c));
      setEditingId(null);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error al eliminar"); return; }
      toast.success("Cupón eliminado");
      setCoupons((p) => p.filter((c) => c.id !== id));
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoadingId(null); }
  }

  return (
    <div className="flex flex-col gap-4">
      {coupons.map((coupon) =>
        editingId === coupon.id ? (
          <CouponForm key={coupon.id} coupon={coupon} onSubmit={(d) => handleUpdate(coupon.id, d)} onCancel={() => setEditingId(null)} loading={formLoading} />
        ) : (
          <div key={coupon.id} className={`bg-graphite-700/40 border rounded-[12px] p-4 flex items-start justify-between gap-4 ${coupon.isActive ? "border-white/8" : "border-white/4 opacity-50"}`}>
            <div className="flex items-start gap-3">
              <Ticket size={15} className="text-slate-300 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-snow font-mono">{coupon.code}</p>
                  {!coupon.isActive && <span className="text-xs text-slate-300/50 border border-white/10 px-1.5 rounded">Inactivo</span>}
                  {coupon.expiresAt && new Date(coupon.expiresAt) < new Date() && (
                    <span className="text-xs text-ember-red border border-ember-red/20 px-1.5 rounded">Expirado</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {coupon.type === "PERCENT" ? `${coupon.value}%` : `${coupon.value.toFixed(2)} €`} dto.
                  {coupon.minOrderAmount && ` · Mín. ${coupon.minOrderAmount} €`}
                  {" · "}<span className="tabular-nums">{coupon.usesCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""} usos</span>
                  {coupon.expiresAt && ` · Expira ${new Date(coupon.expiresAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditingId(coupon.id)} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-snow hover:bg-white/6 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(coupon.id)} disabled={loadingId === coupon.id} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-ember-red hover:bg-ember-red/8 transition-colors disabled:opacity-30">
                {loadingId === coupon.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        )
      )}
      {showCreate ? (
        <CouponForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} />
      ) : (
        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/15 hover:border-white/30 rounded-[12px] text-sm text-slate-300 hover:text-snow transition-all">
          <Plus size={14} />
          Nuevo cupón
        </button>
      )}
    </div>
  );
}
