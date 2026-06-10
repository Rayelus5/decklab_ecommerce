"use client";

import { useState } from "react";
import { recalculateAllUsersVip } from "@/lib/vip";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export function VipTierRecalculate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRecalculate = async () => {
    if (!confirm("¿Estás seguro de que quieres recalcular el Nivel VIP de todos los usuarios? Este proceso revisará el historial de compras de cada usuario para asignarle su nivel adecuado.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await recalculateAllUsersVip();
      if (res.success) {
        toast.success(`Se han recalculado y actualizado ${res.updatedCount} usuarios correctamente.`);
        router.refresh();
      } else {
        toast.error(res.error || "Error al recalcular.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al recalcular.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRecalculate}
      disabled={loading}
      className="cursor-pointer flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
      {loading ? "Calculando..." : "Recalcular a todos los usuarios"}
    </button>
  );
}
