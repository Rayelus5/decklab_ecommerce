"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Crown, Plus, Minus, Ban, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProTierOption {
  id: string;
  name: string;
  monthlyAllowance: number;
}

interface UserActionsProps {
  userId: string;
  currentAllowance: number;
  isTelegramMember: boolean;
  isPro: boolean;
  isBlocked: boolean;
  proTierId: string | null;
  proTiers: ProTierOption[];
}

export function UserActions({
  userId,
  currentAllowance,
  isTelegramMember,
  isPro,
  isBlocked,
  proTierId,
  proTiers,
}: UserActionsProps) {
  const router = useRouter();
  const [allowance, setAllowance] = useState(currentAllowance.toFixed(2));
  const [telegramMember, setTelegramMember] = useState(isTelegramMember);
  const [proActive, setProActive] = useState(isPro);
  const [selectedTierId, setSelectedTierId] = useState<string>(proTierId ?? "");
  const [blocked, setBlocked] = useState(isBlocked);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // Ajuste rápido de allowance
  function adjustAllowance(delta: number) {
    const current = parseFloat(allowance) || 0;
    const next = Math.max(0, current + delta);
    setAllowance(next.toFixed(2));
  }

  async function handleSave() {
    if (proActive && !selectedTierId) {
      toast.error("Selecciona un plan PRO para activar la suscripción.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proAllowanceBalance: parseFloat(allowance),
          isTelegramMember: telegramMember,
          isPro: proActive,
          proTierId: proActive ? selectedTierId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al actualizar");
        return;
      }
      toast.success("Usuario actualizado correctamente");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBlock() {
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !blocked }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al actualizar");
        return;
      }
      setBlocked(!blocked);
      toast.success(blocked ? "Usuario desbloqueado" : "Usuario bloqueado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setBlockLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Suscripción PRO */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
          <Crown size={14} className="text-amber-400" />
          Suscripción PRO
        </h2>

        {/* Toggle PRO */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-slate-300">Estado PRO</span>
          <button
            type="button"
            onClick={() => {
              setProActive((v) => !v);
              if (proActive) setSelectedTierId("");
            }}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              proActive ? "bg-amber-500" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                proActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        {/* Selector de tier */}
        {proActive && (
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Plan / Tier</label>
            <select
              value={selectedTierId}
              onChange={(e) => setSelectedTierId(e.target.value)}
              className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow focus:outline-none focus:border-white/25 transition-colors"
            >
              <option value="">— Selecciona un tier —</option>
              {proTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} ({tier.monthlyAllowance.toFixed(0)} €/mes)
                </option>
              ))}
            </select>
            {proTiers.length === 0 && (
              <p className="text-xs text-slate-300/60 mt-1">
                No hay tiers activos. Créalos en{" "}
                <a href="/admin/pro-tiers" className="underline text-amber-400">PRO Tiers</a>.
              </p>
            )}
          </div>
        )}

        {/* Balance allowance */}
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">
            Balance allowance (€)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustAllowance(-10)}
              title="-10 €"
              className="p-1.5 rounded-[6px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-snow transition-colors"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              step="0.01"
              min="0"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              className="flex-1 px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow focus:outline-none focus:border-white/25 transition-colors text-center tabular-nums"
            />
            <button
              type="button"
              onClick={() => adjustAllowance(10)}
              title="+10 €"
              className="p-1.5 rounded-[6px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-snow transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[25, 50, 100].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => adjustAllowance(amount)}
                className="text-xs px-2 py-1 rounded-[5px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-snow transition-colors"
              >
                +{amount} €
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAllowance("0.00")}
              className="text-xs px-2 py-1 rounded-[5px] bg-white/5 hover:bg-white/10 text-ember-red/70 hover:text-ember-red transition-colors ml-auto"
            >
              Resetear
            </button>
          </div>
        </div>
      </div>

      {/* Acceso y permisos */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow">Acceso</h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={telegramMember}
            onChange={(e) => setTelegramMember(e.target.checked)}
            className="w-4 h-4 rounded accent-mint-signal"
          />
          <span className="text-sm text-slate-300">Membresía Telegram verificada</span>
        </label>

        <Button onClick={handleSave} loading={loading} size="sm">
          <Save size={14} />
          Guardar cambios
        </Button>
      </div>

      {/* Bloquear cuenta */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-snow">Seguridad</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {blocked
            ? "Esta cuenta está bloqueada. El usuario no puede iniciar sesión."
            : "Bloquear impide el acceso inmediato sin eliminar la cuenta."}
        </p>
        <Button
          onClick={handleToggleBlock}
          loading={blockLoading}
          size="sm"
          variant={blocked ? "outline" : "ghost"}
          className={
            blocked
              ? "border-mint-signal/30 text-mint-signal hover:bg-mint-signal/10"
              : "border-ember-red/30 text-ember-red hover:bg-ember-red/10"
          }
        >
          {blocked ? <ShieldCheck size={14} /> : <Ban size={14} />}
          {blocked ? "Desbloquear cuenta" : "Bloquear cuenta"}
        </Button>
      </div>
    </div>
  );
}
