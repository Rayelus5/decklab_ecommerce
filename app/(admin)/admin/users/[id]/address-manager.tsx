"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin, Plus, Pencil, Trash2, Star, X, Check, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface AdminAddress {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  province: string | null;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddressManagerProps {
  userId: string;
  initialAddresses: AdminAddress[];
}

// ---------------------------------------------------------------------------
// Formulario de dirección (creación / edición)
// ---------------------------------------------------------------------------
interface FormState {
  label: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const emptyForm = (): FormState => ({
  label: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  province: "",
  country: "ES",
  phone: "",
  isDefault: false,
});

function formFromAddress(addr: AdminAddress): FormState {
  return {
    label: addr.label ?? "",
    line1: addr.line1,
    line2: addr.line2 ?? "",
    city: addr.city,
    postalCode: addr.postalCode,
    province: addr.province ?? "",
    country: addr.country,
    phone: addr.phone,
    isDefault: addr.isDefault,
  };
}

const inputClass =
  "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/30 focus:outline-none focus:border-white/25 transition-colors";

// ---------------------------------------------------------------------------
// Componente AddressForm
// ---------------------------------------------------------------------------
interface AddressFormProps {
  userId: string;
  addressId?: string;   // undefined = crear, string = editar
  initial: FormState;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddressForm({ userId, addressId, initial, onSuccess, onCancel }: AddressFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim() || !form.postalCode.trim() || !form.phone.trim()) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const url = addressId
        ? `/api/admin/users/${userId}/addresses/${addressId}`
        : `/api/admin/users/${userId}/addresses`;

      const res = await fetch(url, {
        method: addressId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim() || null,
          line1: form.line1.trim(),
          line2: form.line2.trim() || null,
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          province: form.province.trim() || null,
          country: form.country,
          phone: form.phone.trim(),
          isDefault: form.isDefault,
        }),
      });

      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }

      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar la dirección");
        return;
      }

      toast.success(addressId ? "Dirección actualizada" : "Dirección añadida");
      onSuccess();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        {/* Etiqueta */}
        <div className="col-span-2">
          <label className="block text-xs text-slate-300 mb-1">Etiqueta (opcional)</label>
          <input name="label" value={form.label} onChange={handleChange}
            placeholder="Casa, Trabajo, Padres…" className={inputClass} />
        </div>

        {/* Línea 1 */}
        <div className="col-span-2">
          <label className="block text-xs text-slate-300 mb-1">
            Dirección <span className="text-ember-red">*</span>
          </label>
          <input name="line1" value={form.line1} onChange={handleChange}
            placeholder="Calle Ejemplo, 12" className={inputClass} />
        </div>

        {/* Línea 2 */}
        <div className="col-span-2">
          <label className="block text-xs text-slate-300 mb-1">Piso / Depto. (opcional)</label>
          <input name="line2" value={form.line2} onChange={handleChange}
            placeholder="2ºA, Portal 3…" className={inputClass} />
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">
            Ciudad <span className="text-ember-red">*</span>
          </label>
          <input name="city" value={form.city} onChange={handleChange}
            placeholder="Madrid" className={inputClass} />
        </div>

        {/* Código postal */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">
            C.P. <span className="text-ember-red">*</span>
          </label>
          <input name="postalCode" value={form.postalCode} onChange={handleChange}
            placeholder="28001" className={inputClass} />
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">Provincia</label>
          <input name="province" value={form.province} onChange={handleChange}
            placeholder="Madrid" className={inputClass} />
        </div>

        {/* País */}
        <div>
          <label className="block text-xs text-slate-300 mb-1">País</label>
          <select name="country" value={form.country} onChange={handleChange} className={inputClass}>
            <option value="ES">España (ES)</option>
            <option value="PT">Portugal (PT)</option>
            <option value="FR">Francia (FR)</option>
            <option value="DE">Alemania (DE)</option>
            <option value="IT">Italia (IT)</option>
            <option value="GB">Reino Unido (GB)</option>
            <option value="US">Estados Unidos (US)</option>
            <option value="MX">México (MX)</option>
            <option value="AR">Argentina (AR)</option>
            <option value="CL">Chile (CL)</option>
            <option value="CO">Colombia (CO)</option>
          </select>
        </div>

        {/* Teléfono */}
        <div className="col-span-2">
          <label className="block text-xs text-slate-300 mb-1">
            Teléfono <span className="text-ember-red">*</span>
          </label>
          <input name="phone" value={form.phone} onChange={handleChange} type="tel"
            placeholder="+34 600 000 000" className={inputClass} />
        </div>
      </div>

      {/* Predeterminada */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
          className="w-4 h-4 rounded accent-mint-signal"
        />
        <span className="text-sm text-slate-300">Marcar como predeterminada</span>
      </label>

      {/* Botones */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-[8px] text-sm text-slate-300 hover:text-snow bg-white/5 hover:bg-white/8 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-sm font-semibold bg-ash-50 text-graphite-700 hover:bg-ash-50/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {addressId ? "Guardar" : "Añadir"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Componente principal AddressManager
// ---------------------------------------------------------------------------
export function AddressManager({ userId, initialAddresses }: AddressManagerProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AdminAddress[]>(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  async function handleDelete(addr: AdminAddress) {
    if (!confirm(`¿Eliminar la dirección "${addr.label ?? addr.line1}"?`)) return;
    setDeletingId(addr.id);
    try {
      const res = await fetch(`/api/admin/users/${userId}/addresses/${addr.id}`, {
        method: "DELETE",
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok) {
        toast.error(data.error ?? "Error al eliminar");
        return;
      }
      toast.success("Dirección eliminada");
      router.refresh();
      setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  }

  function onSuccess() {
    setEditingId(null);
    setShowNewForm(false);
    router.refresh();
    // Refetch ligero: en un Server Component parent, router.refresh() rehidrata los datos
  }

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-snow hover:text-slate-300 transition-colors"
        >
          <MapPin size={14} className="text-slate-300" />
          Direcciones
          <span className="text-xs font-normal text-slate-300/60 ml-1">
            ({addresses.length})
          </span>
          {collapsed
            ? <ChevronDown size={13} className="text-slate-300/60 ml-1" />
            : <ChevronUp size={13} className="text-slate-300/60 ml-1" />
          }
        </button>
        {!collapsed && (
          <button
            onClick={() => { setShowNewForm((v) => !v); setEditingId(null); }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium text-slate-300 hover:text-snow bg-white/5 hover:bg-white/8 transition-colors"
          >
            {showNewForm ? <X size={12} /> : <Plus size={12} />}
            {showNewForm ? "Cancelar" : "Nueva"}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-5 flex flex-col gap-4">
          {/* Lista de direcciones */}
          {addresses.length === 0 && !showNewForm && (
            <p className="text-sm text-slate-300/60 text-center py-4">
              Este usuario no tiene direcciones guardadas.
            </p>
          )}

          {addresses.map((addr) => (
            <div key={addr.id} className="flex flex-col gap-3">
              {editingId === addr.id ? (
                /* Formulario de edición inline */
                <div className="bg-graphite-600/40 border border-white/8 rounded-[12px] p-4">
                  <p className="text-xs font-medium text-slate-300 mb-3">Editando dirección</p>
                  <AddressForm
                    userId={userId}
                    addressId={addr.id}
                    initial={formFromAddress(addr)}
                    onSuccess={onSuccess}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                /* Tarjeta de dirección */
                <div className="flex items-start justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-mint-signal">
                          <Star size={10} className="fill-mint-signal" /> Pred.
                        </span>
                      )}
                      {addr.label && (
                        <span className="text-xs font-medium text-snow">{addr.label}</span>
                      )}
                    </div>
                    <p className="text-sm text-snow truncate">{addr.line1}</p>
                    {addr.line2 && (
                      <p className="text-xs text-slate-300/70">{addr.line2}</p>
                    )}
                    <p className="text-xs text-slate-300/70">
                      {addr.postalCode} {addr.city}
                      {addr.province ? `, ${addr.province}` : ""} — {addr.country}
                    </p>
                    <p className="text-xs text-slate-300/50 mt-0.5">{addr.phone}</p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { setEditingId(addr.id); setShowNewForm(false); }}
                      title="Editar"
                      className="p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(addr)}
                      disabled={deletingId === addr.id}
                      title="Eliminar"
                      className="p-1.5 rounded-[6px] text-slate-300 hover:text-ember-red hover:bg-ember-red/10 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === addr.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Separador entre direcciones */}
              <div className="border-t border-white/5 last:hidden" />
            </div>
          ))}

          {/* Formulario de nueva dirección */}
          {showNewForm && (
            <div className="bg-graphite-600/40 border border-white/8 rounded-[12px] p-4">
              <p className="text-xs font-medium text-slate-300 mb-3">Nueva dirección</p>
              <AddressForm
                userId={userId}
                initial={emptyForm()}
                onSuccess={onSuccess}
                onCancel={() => setShowNewForm(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
