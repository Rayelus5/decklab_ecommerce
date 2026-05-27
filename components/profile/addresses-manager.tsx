"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Plus, Pencil, Trash2, Star, StarOff, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(3, "La dirección es obligatoria"),
  line2: z.string().optional(),
  city: z.string().min(2, "La ciudad es obligatoria"),
  postalCode: z.string().min(4, "Código postal inválido"),
  province: z.string().optional(),
  country: z.string().min(2),
  phone: z.string().min(6, "El teléfono es obligatorio"),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
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

interface AddressesManagerProps {
  initialAddresses: Address[];
}

function AddressForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "ES", isDefault: false as boolean, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Label & phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">
            Etiqueta <span className="text-slate-300/50">(opcional)</span>
          </label>
          <input
            {...register("label")}
            placeholder="Casa, Trabajo..."
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Teléfono</label>
          <input
            {...register("phone")}
            placeholder="+34 600 000 000"
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
          {errors.phone && (
            <p className="text-xs text-ember-red mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Address line 1 */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Dirección</label>
        <input
          {...register("line1")}
          placeholder="Calle, número, piso..."
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
        {errors.line1 && (
          <p className="text-xs text-ember-red mt-1">{errors.line1.message}</p>
        )}
      </div>

      {/* Line 2 */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">
          Información adicional <span className="text-slate-300/50">(opcional)</span>
        </label>
        <input
          {...register("line2")}
          placeholder="Bloque, escalera, portal..."
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {/* City / Postal / Province / Country */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Ciudad</label>
          <input
            {...register("city")}
            placeholder="Madrid"
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
          {errors.city && (
            <p className="text-xs text-ember-red mt-1">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Código postal</label>
          <input
            {...register("postalCode")}
            placeholder="28001"
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
          {errors.postalCode && (
            <p className="text-xs text-ember-red mt-1">{errors.postalCode.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">
            Provincia <span className="text-slate-300/50">(opcional)</span>
          </label>
          <input
            {...register("province")}
            placeholder="Madrid"
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">País (ISO)</label>
          <input
            {...register("country")}
            placeholder="ES"
            maxLength={2}
            className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors uppercase"
          />
        </div>
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          {...register("isDefault")}
          className="w-4 h-4 rounded border-white/20 bg-graphite-600/60 accent-mint-signal"
        />
        <span className="text-sm text-slate-300">Establecer como dirección predeterminada</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isLoading} className="flex-1">
          <Check size={14} />
          Guardar dirección
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          <X size={14} />
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function AddressesManager({ initialAddresses }: AddressesManagerProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleCreate(data: AddressFormData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar la dirección");
        return;
      }
      toast.success("Dirección añadida");
      setAddresses((prev) =>
        data.isDefault
          ? [{ ...json }, ...prev.map((a) => ({ ...a, isDefault: false }))]
          : [...prev, { ...json }]
      );
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEdit(id: string, data: AddressFormData) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al actualizar la dirección");
        return;
      }
      toast.success("Dirección actualizada");
      setAddresses((prev) =>
        prev.map((a) => {
          if (a.id === id) return { ...json };
          if (data.isDefault) return { ...a, isDefault: false };
          return a;
        })
      );
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        toast.error("Error al actualizar");
        return;
      }
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      toast.success("Dirección predeterminada actualizada");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar");
        return;
      }
      toast.success("Dirección eliminada");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing addresses */}
      {addresses.length === 0 && !showForm && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-graphite-600/60 flex items-center justify-center">
            <MapPin size={22} className="text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-snow">Sin direcciones guardadas</p>
            <p className="text-xs text-slate-300 mt-1">
              Añade tu primera dirección de envío para agilizar el checkout.
            </p>
          </div>
        </div>
      )}

      {addresses.map((address) =>
        editingId === address.id ? (
          <div key={address.id} className="bg-graphite-700/40 border border-white/15 rounded-[16px] p-5">
            <p className="text-sm font-semibold text-snow mb-4">Editar dirección</p>
            <AddressForm
              defaultValues={{
                label: address.label ?? undefined,
                line1: address.line1,
                line2: address.line2 ?? undefined,
                city: address.city,
                postalCode: address.postalCode,
                province: address.province ?? undefined,
                country: address.country,
                phone: address.phone,
                isDefault: address.isDefault,
              }}
              onSubmit={(data) => handleEdit(address.id, data)}
              onCancel={() => setEditingId(null)}
              isLoading={formLoading}
            />
          </div>
        ) : (
          <div
            key={address.id}
            className={`bg-graphite-700/40 border rounded-[14px] p-5 flex items-start justify-between gap-4 transition-all ${
              address.isDefault ? "border-mint-signal/25" : "border-white/8"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-graphite-600/60 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={14} className="text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {address.label && (
                    <p className="text-xs font-semibold text-snow uppercase tracking-wide">
                      {address.label}
                    </p>
                  )}
                  {address.isDefault && (
                    <span className="text-xs text-mint-signal font-medium">Predeterminada</span>
                  )}
                </div>
                <p className="text-sm text-snow mt-1">{address.line1}</p>
                {address.line2 && <p className="text-xs text-slate-300">{address.line2}</p>}
                <p className="text-xs text-slate-300 mt-0.5">
                  {address.postalCode} {address.city}
                  {address.province ? `, ${address.province}` : ""}
                </p>
                <p className="text-xs text-slate-300">{address.country}</p>
                <p className="text-xs text-slate-300/60 mt-1">{address.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  disabled={loadingId === address.id}
                  className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-mint-signal hover:bg-white/6 transition-colors disabled:opacity-50"
                  title="Establecer como predeterminada"
                >
                  {loadingId === address.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Star size={14} />
                  )}
                </button>
              )}
              <button
                onClick={() => setEditingId(address.id)}
                className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-snow hover:bg-white/6 transition-colors"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                disabled={loadingId === address.id}
                className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-ember-red hover:bg-ember-red/8 transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                {loadingId === address.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          </div>
        )
      )}

      {/* Add new address form */}
      {showForm && (
        <div className="bg-graphite-700/40 border border-white/15 rounded-[16px] p-5">
          <p className="text-sm font-semibold text-snow mb-4">Nueva dirección</p>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={formLoading}
          />
        </div>
      )}

      {/* Add button */}
      {!showForm && !editingId && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/15 hover:border-white/30 rounded-[12px] text-sm text-slate-300 hover:text-snow transition-all"
        >
          <Plus size={14} />
          Añadir dirección
        </button>
      )}
    </div>
  );
}
