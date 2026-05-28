"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
}

interface Product {
  id: string;
  title: string;
}

interface ReservationFormProps {
  coupons: Coupon[];
  products: Product[];
  initial?: {
    id: string;
    name: string;
    description: string | null;
    opensAt: string; // ISO
    closesAt: string;
    deliveryDate: string | null;
    couponId: string | null;
    productIds: string[];
    badgeText: string;
    popupEnabled: boolean;
    maxUnits: number | null;
    isActive: boolean;
  };
}

export function ReservationForm({ coupons, products, initial }: ReservationFormProps) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  /**
   * Convierte una fecha ISO (UTC) al formato "YYYY-MM-DDTHH:MM" en hora LOCAL,
   * que es el valor que espera el input type="datetime-local".
   * Al guardar, new Date("YYYY-MM-DDTHH:MM") lo trata como hora local → UTC correcto.
   */
  const toDatetimeLocal = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [opensAt, setOpensAt] = useState(toDatetimeLocal(initial?.opensAt ?? null));
  const [closesAt, setClosesAt] = useState(toDatetimeLocal(initial?.closesAt ?? null));
  const [deliveryDate, setDeliveryDate] = useState(toDatetimeLocal(initial?.deliveryDate ?? null));
  const [couponId, setCouponId] = useState(initial?.couponId ?? "");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(initial?.productIds ?? [])
  );
  const [badgeText, setBadgeText] = useState(initial?.badgeText ?? "RESERVA");
  const [popupEnabled, setPopupEnabled] = useState(initial?.popupEnabled ?? true);
  const [maxUnits, setMaxUnits] = useState<string>(initial?.maxUnits?.toString() ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      description: description || null,
      opensAt: opensAt ? new Date(opensAt).toISOString() : undefined,
      closesAt: closesAt ? new Date(closesAt).toISOString() : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
      couponId: couponId || null,
      productIds: Array.from(selectedProducts),
      badgeText,
      popupEnabled,
      maxUnits: maxUnits ? Number(maxUnits) : null,
      isActive,
    };

    try {
      const url = isEdit
        ? `/api/admin/reservations/${initial!.id}`
        : "/api/admin/reservations";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Error al guardar la reserva";
        try {
          const data = await res.json() as { error?: string };
          errorMessage = data.error ?? errorMessage;
        } catch {
          // Response body is not JSON (e.g. 500 with empty body)
        }
        throw new Error(errorMessage);
      }

      toast.success(isEdit ? "Reserva actualizada" : "Reserva creada");
      router.push("/admin/reservations");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("¿Eliminar esta reserva? Esta acción no se puede deshacer.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reservations/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        let errorMessage = "No se pudo eliminar la reserva";
        try {
          const data = await res.json() as { error?: string };
          errorMessage = data.error ?? errorMessage;
        } catch { /* empty body */ }
        throw new Error(errorMessage);
      }
      toast.success("Reserva eliminada");
      router.push("/admin/reservations");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la reserva");
    } finally {
      setDeleting(false);
    }
  }

  const fieldClass = "w-full bg-graphite-700/50 border border-white/10 rounded-[10px] px-3 py-2.5 text-snow text-sm placeholder-slate-400 focus:outline-none focus:border-white/25 transition-colors";
  const labelClass = "block text-xs font-medium text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Nombre */}
      <div>
        <label className={labelClass} htmlFor="name">Nombre *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Reserva Enero 2026"
          className={fieldClass}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className={labelClass} htmlFor="description">Descripción (popup)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Texto informativo que aparecerá en el popup de la tienda…"
          className={`${fieldClass} resize-none`}
        />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="opensAt">Apertura *</label>
          <input
            id="opensAt"
            type="datetime-local"
            value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="closesAt">Cierre *</label>
          <input
            id="closesAt"
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="deliveryDate">Entrega estimada</label>
          <input
            id="deliveryDate"
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Cupón */}
      <div>
        <label className={labelClass} htmlFor="coupon">Cupón de descuento</label>
        <select
          id="coupon"
          value={couponId}
          onChange={(e) => setCouponId(e.target.value)}
          className={fieldClass}
        >
          <option value="">— Sin cupón —</option>
          {coupons.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.type === "PERCENT" ? `${c.value}%` : `${c.value}€`}
              {c.maxUses ? ` (máx. ${c.maxUses} usos)` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Productos asociados */}
      <div>
        <label className={labelClass}>Productos en reserva ({selectedProducts.size} seleccionados)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 mt-1">
          {products.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] cursor-pointer transition-colors text-sm ${
                selectedProducts.has(p.id)
                  ? "bg-amber-500/15 border border-amber-500/30 text-snow"
                  : "bg-white/4 border border-white/8 text-slate-300 hover:bg-white/7"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedProducts.has(p.id)}
                onChange={() => toggleProduct(p.id)}
                className="accent-amber-500 shrink-0"
              />
              <span className="truncate">{p.title}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Configuración visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} htmlFor="badgeText">Texto del badge</label>
          <input
            id="badgeText"
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            maxLength={20}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="maxUnits">Plazas máximas</label>
          <input
            id="maxUnits"
            type="number"
            value={maxUnits}
            onChange={(e) => setMaxUnits(e.target.value)}
            min="1"
            placeholder="Sin límite"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setPopupEnabled((v) => !v)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${popupEnabled ? "bg-amber-500" : "bg-white/15"}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${popupEnabled ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm text-slate-300">Mostrar popup</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-white/15"}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm text-slate-300">Activa</span>
          </label>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/8">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[10px] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEdit ? "Guardar cambios" : "Crear reserva"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ember-red/10 hover:bg-ember-red/20 border border-ember-red/30 text-ember-red font-semibold text-sm rounded-[10px] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
