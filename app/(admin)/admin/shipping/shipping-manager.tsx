"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShippingRate {
  id: string;
  name: string;
  type: string;
  region: string;
  minWeight: number;
  maxWeight: number;
  price: number;
  active: boolean;
}

interface ShippingManagerProps {
  initialRates: ShippingRate[];
}

const field = "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

function RateForm({
  rate,
  onSubmit,
  onCancel,
  loading,
}: {
  rate?: ShippingRate;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: rate?.name ?? "",
    type: rate?.type ?? "ORDINARIO",
    region: rate?.region ?? "NATIONAL",
    minWeight: rate?.minWeight?.toString() ?? "0",
    maxWeight: rate?.maxWeight?.toString() ?? "500",
    price: rate?.price?.toFixed(2) ?? "",
    active: rate?.active ?? true,
  });

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSubmit() {
    onSubmit({
      name: form.name,
      type: form.type,
      region: form.region,
      minWeight: parseInt(form.minWeight),
      maxWeight: parseInt(form.maxWeight),
      price: parseFloat(form.price),
      active: form.active,
    });
  }

  return (
    <div className="bg-graphite-700/40 border border-white/15 rounded-[14px] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-snow">{rate ? "Editar tarifa" : "Nueva tarifa"}</h3>
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Nombre descriptivo</label>
        <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Ordinario Nacional 0-500g" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Tipo</label>
          <select className={field} value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="ORDINARIO">Ordinario</option>
            <option value="CERTIFICADO">Certificado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Región</label>
          <select className={field} value={form.region} onChange={(e) => set("region", e.target.value)}>
            <option value="NATIONAL">Nacional</option>
            <option value="EUROPE">Europa</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Peso mín. (g)</label>
          <input className={field} type="number" value={form.minWeight} onChange={(e) => set("minWeight", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Peso máx. (g, -1 = sin límite)</label>
          <input className={field} type="number" value={form.maxWeight} onChange={(e) => set("maxWeight", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Precio (&euro;)</label>
          <input className={field} type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 rounded accent-mint-signal" />
        <span className="text-sm text-slate-300">Tarifa activa</span>
      </label>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={loading} className="cursor-pointer"><Check size={14} />{rate ? "Guardar" : "Crear tarifa"}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading} className="cursor-pointer"><X size={14} />Cancelar</Button>
      </div>
    </div>
  );
}

export function ShippingManager({ initialRates }: ShippingManagerProps) {
  const router = useRouter();
  const [rates, setRates] = useState(initialRates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleCreate(data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Tarifa creada");
      setRates((p) => [...p, json]);
      setShowCreate(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/shipping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Tarifa actualizada");
      setRates((p) => p.map((r) => r.id === id ? json : r));
      setEditingId(null);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/shipping/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error al eliminar"); return; }
      toast.success("Tarifa eliminada");
      setRates((p) => p.filter((r) => r.id !== id));
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoadingId(null); }
  }

  const REGION_LABELS: Record<string, string> = { NATIONAL: "Nacional", EUROPE: "Europa" };
  const TYPE_COLORS: Record<string, string> = { ORDINARIO: "text-sky-400", CERTIFICADO: "text-amber-400" };

  return (
    <div className="flex flex-col gap-4">
      {rates.map((rate) =>
        editingId === rate.id ? (
          <RateForm key={rate.id} rate={rate} onSubmit={(d) => handleUpdate(rate.id, d)} onCancel={() => setEditingId(null)} loading={formLoading} />
        ) : (
          <div key={rate.id} className={`bg-graphite-700/40 border rounded-[12px] p-4 flex items-center justify-between gap-4 ${rate.active ? "border-white/8" : "border-white/4 opacity-50"}`}>
            <div className="flex items-center gap-3">
              <Truck size={15} className="text-slate-300 shrink-0" />
              <div>
                <p className="text-sm font-medium text-snow">{rate.name}</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  <span className={TYPE_COLORS[rate.type] ?? "text-slate-300"}>{rate.type}</span>
                  {" · "}{REGION_LABELS[rate.region] ?? rate.region}
                  {" · "}{rate.minWeight}g – {rate.maxWeight === -1 ? "∞" : `${rate.maxWeight}g`}
                  {" · "}<span className="font-semibold text-snow">{rate.price.toFixed(2).replace(".", ",")} &euro;</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditingId(rate.id)} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-snow hover:bg-white/6 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(rate.id)} disabled={loadingId === rate.id} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-ember-red hover:bg-ember-red/8 transition-colors disabled:opacity-30">
                {loadingId === rate.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        )
      )}
      {showCreate ? (
        <RateForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} />
      ) : (
        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/15 hover:border-white/30 rounded-[12px] text-sm text-slate-300 hover:text-snow transition-all">
          <Plus size={14} />
          Nueva tarifa
        </button>
      )}
    </div>
  );
}
