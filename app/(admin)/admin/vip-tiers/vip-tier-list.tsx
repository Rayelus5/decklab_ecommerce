"use client";

import { useState } from "react";
import { deleteVipTier } from "@/lib/vip";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function VipTierList({ tiers }: { tiers: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar este nivel VIP?")) return;
    
    setLoadingId(id);
    try {
      await deleteVipTier(id);
      toast.success("Nivel borrado correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Error al borrar el nivel. Asegúrate de que no tenga usuarios asignados.");
    } finally {
      setLoadingId(null);
    }
  };

  if (tiers.length === 0) {
    return <p className="text-slate-400 text-sm">No hay niveles VIP creados.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {tiers.map((tier) => (
        <div key={tier.id} className="bg-graphite-700/50 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative group">
          <div className="flex justify-between items-center">
            <span className="font-bold text-snow" style={{ color: tier.color }}>
              Nivel {tier.level}: {tier.name}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md font-semibold">
                {tier.cashbackPercent.toString()}% Cashback
              </span>
              <button
                onClick={() => handleDelete(tier.id)}
                disabled={loadingId === tier.id}
                className="text-slate-400 hover:text-ember-red transition-colors disabled:opacity-50"
                title="Borrar Nivel"
              >
                {loadingId === tier.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
          <div className="text-sm text-slate-400 flex gap-4 mt-2">
            <span>Mín. Gasto: <strong className="text-snow">{tier.minSpent.toString()}€</strong></span>
            <span>Mín. Pedidos: <strong className="text-snow">{tier.minOrders}</strong></span>
          </div>
        </div>
      ))}
    </div>
  );
}
