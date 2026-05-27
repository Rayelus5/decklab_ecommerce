"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  userId: string;
  currentAllowance: number;
  isTelegramMember: boolean;
}

export function UserActions({ userId, currentAllowance, isTelegramMember }: UserActionsProps) {
  const router = useRouter();
  const [allowance, setAllowance] = useState(currentAllowance.toFixed(2));
  const [telegramMember, setTelegramMember] = useState(isTelegramMember);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proAllowanceBalance: parseFloat(allowance),
          isTelegramMember: telegramMember,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al actualizar");
        return;
      }
      toast.success("Usuario actualizado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-snow">Gestión de cuenta</h2>

      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Balance PRO allowance (&euro;)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={allowance}
          onChange={(e) => setAllowance(e.target.value)}
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow focus:outline-none focus:border-white/25 transition-colors"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={telegramMember}
          onChange={(e) => setTelegramMember(e.target.checked)}
          className="w-4 h-4 rounded accent-mint-signal"
        />
        <span className="text-sm text-slate-300">Miembro de Telegram verificado</span>
      </label>

      <Button onClick={handleSave} loading={loading} size="sm">
        <Save size={14} />
        Guardar cambios
      </Button>
    </div>
  );
}
