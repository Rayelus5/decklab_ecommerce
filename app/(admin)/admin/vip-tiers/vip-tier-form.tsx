"use client";

import { useState } from "react";
import { createVipTier } from "@/lib/vip";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function VipTierForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    level: 1,
    name: "",
    minSpent: 0,
    minOrders: 0,
    cashbackPercent: 0,
    color: "#FBBF24",
    iconImage: "https://placeholder.co/100"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createVipTier({
        ...formData,
        level: Number(formData.level),
        minSpent: Number(formData.minSpent),
        minOrders: Number(formData.minOrders),
        cashbackPercent: Number(formData.cashbackPercent),
      });
      toast.success("Nivel VIP creado con éxito");
      router.refresh();
      // Reset form
      setFormData({
        level: formData.level + 1,
        name: "",
        minSpent: 0,
        minOrders: 0,
        cashbackPercent: 0,
        color: "#FBBF24",
        iconImage: "https://placeholder.co/100"
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el nivel VIP. Comprueba que el Nivel no esté repetido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-slate-300">
          Nivel (1-10)
          <input type="number" min="1" max="10" required
            className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
            value={formData.level} onChange={(e) => setFormData({...formData, level: Number(e.target.value)})}
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-300">
          Nombre del Nivel
          <input type="text" required placeholder="Ej. Oro, Diamante"
            className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-slate-300">
          Gasto Mínimo (€)
          <input type="number" min="0" step="0.01" required
            className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
            value={formData.minSpent} onChange={(e) => setFormData({...formData, minSpent: Number(e.target.value)})}
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-300">
          Pedidos Mínimos
          <input type="number" min="0" required
            className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
            value={formData.minOrders} onChange={(e) => setFormData({...formData, minOrders: Number(e.target.value)})}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-slate-300">
          Cashback (%)
          <input type="number" min="0" max="100" step="0.1" required
            className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
            value={formData.cashbackPercent} onChange={(e) => setFormData({...formData, cashbackPercent: Number(e.target.value)})}
          />
        </label>
        <label className="flex flex-col gap-1 text-slate-300">
          Color (Hex)
          <div className="flex gap-2">
            <input type="color" className="w-10 h-10 bg-transparent cursor-pointer"
              value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
            <input type="text" required
              className="bg-black/40 border border-white/10 rounded-md p-2 text-snow w-full"
              value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
            />
          </div>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-slate-300">
        URL de la Imagen/Icono
        <input type="url" required
          className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
          value={formData.iconImage} onChange={(e) => setFormData({...formData, iconImage: e.target.value})}
        />
      </label>

      <button type="submit" disabled={loading} className="mt-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-md transition-colors flex justify-center items-center">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Nivel VIP"}
      </button>
    </form>
  );
}
