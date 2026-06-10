"use client";

import { useState } from "react";
import { createPromoCodeAdmin } from "./actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EggRarity } from "@prisma/client";
import { toast } from "sonner";

export function PromoCodeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    rarity: "COMMON" as EggRarity,
    count: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;
    
    setLoading(true);

    try {
      const res = await createPromoCodeAdmin(formData);
      if (res.success) {
        toast.success(`${formData.count} código(s) generado(s)`);
        setFormData({ ...formData, code: "", count: 1 });
        router.refresh();
      } else {
        toast.error(res.error || "Error al generar códigos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al generar códigos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
      <label className="flex flex-col gap-1 text-slate-300">
        Código Base
        <input 
          type="text" 
          required 
          placeholder="Ej. REGALO-VERANO"
          className="bg-black/40 border border-white/10 rounded-md p-2 text-snow uppercase"
          value={formData.code} 
          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
        />
        <span className="text-[10px] text-slate-500">Si generas más de 1, se añadirá un sufijo aleatorio.</span>
      </label>

      <label className="flex flex-col gap-1 text-slate-300">
        Rareza del Huevo
        <select 
          className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
          value={formData.rarity} 
          onChange={(e) => setFormData({...formData, rarity: e.target.value as EggRarity})}
        >
          <option value="COMMON">Común</option>
          <option value="UNCOMMON">Poco Común</option>
          <option value="RARE">Raro</option>
          <option value="EPIC">Épico</option>
          <option value="LEGENDARY">Legendario</option>
          <option value="MYTHIC">Mítico</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-slate-300">
        Cantidad a Generar
        <input 
          type="number" 
          min="1" 
          max="100" 
          required
          className="bg-black/40 border border-white/10 rounded-md p-2 text-snow"
          value={formData.count} 
          onChange={(e) => setFormData({...formData, count: Number(e.target.value)})}
        />
      </label>

      <button 
        type="submit" 
        disabled={loading} 
        className="cursor-pointer mt-2 bg-mint-signal hover:bg-mint-signal/80 text-black font-bold py-2 px-4 rounded-md transition-colors flex justify-center items-center"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generar Código(s)"}
      </button>
    </form>
  );
}
