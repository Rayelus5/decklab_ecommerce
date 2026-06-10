"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Crown, Plus, Minus, Ban, ShieldCheck, Send, Unlink, Loader2 } from "lucide-react";
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
  telegramId: string | null;
  telegramUsername: string | null;
  isPro: boolean;
  isBlocked: boolean;
  proTierId: string | null;
  proTiers: ProTierOption[];
}

export function UserActions({
  userId,
  currentAllowance,
  isTelegramMember,
  telegramId: initialTelegramId,
  telegramUsername: initialTelegramUsername,
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

  // Telegram linking state
  const [tgId, setTgId] = useState(initialTelegramId ?? "");
  const [tgUsername, setTgUsername] = useState(initialTelegramUsername ?? "");
  const [tgLoading, setTgLoading] = useState(false);
  const isLinked = !!initialTelegramId;

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

  async function handleTelegramLink() {
    if (!tgId.trim()) {
      toast.error("Introduce el ID numérico de Telegram");
      return;
    }
    if (!/^\d+$/.test(tgId.trim())) {
      toast.error("El ID de Telegram debe ser solo números");
      return;
    }
    setTgLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tgId.trim(),
          telegramUsername: tgUsername.trim() || null,
        }),
      });
      let data: { error?: string; isTelegramMember?: boolean } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok) {
        toast.error(data.error ?? "Error al vincular Telegram");
        return;
      }
      toast.success("Cuenta de Telegram vinculada correctamente");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setTgLoading(false);
    }
  }

  async function handleTelegramUnlink() {
    if (!confirm("¿Desvincular la cuenta de Telegram de este usuario?")) return;
    setTgLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: null }),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok) {
        toast.error(data.error ?? "Error al desvincular");
        return;
      }
      setTgId("");
      setTgUsername("");
      toast.success("Telegram desvinculado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setTgLoading(false);
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
                <a href="/admin/pro-tiers" className="cursor-pointer underline text-amber-400">PRO Tiers</a>.
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

        <Button onClick={handleSave} loading={loading} size="sm" className="cursor-pointer">
          <Save size={14} />
          Guardar cambios
        </Button>
      </div>

      {/* Vincular Telegram */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
          <Send size={14} className="text-sky-400" />
          Telegram
        </h2>

        {isLinked && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 border border-sky-500/20 rounded-[8px]">
            <Send size={12} className="text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sky-300 font-medium truncate">
                ID: {initialTelegramId}
                {initialTelegramUsername && (
                  <span className="text-sky-400/70 ml-1">(@{initialTelegramUsername})</span>
                )}
              </p>
              <p className="text-xs text-slate-300/60 mt-0.5">
                {isTelegramMember ? "Miembro del grupo verificado" : "No es miembro del grupo"}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              ID numérico de Telegram <span className="text-ember-red">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={tgId}
              onChange={(e) => setTgId(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789"
              className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/30 focus:outline-none focus:border-white/25 transition-colors font-mono"
            />
            <p className="text-xs text-slate-300/50 mt-1">
              El usuario puede obtenerlo hablando con{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-sky-400 underline-offset-2 hover:underline"
              >
                @userinfobot
              </a>{" "}
              en Telegram.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              Username (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300/40 text-sm">@</span>
              <input
                type="text"
                value={tgUsername}
                onChange={(e) => setTgUsername(e.target.value.replace(/^@/, ""))}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/30 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTelegramLink}
              disabled={tgLoading}
              className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-sm font-medium bg-sky-500/15 border border-sky-500/25 text-sky-300 hover:bg-sky-500/25 disabled:opacity-60 transition-colors"
            >
              {tgLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {isLinked ? "Actualizar" : "Vincular"}
            </button>
            {isLinked && (
              <button
                type="button"
                onClick={handleTelegramUnlink}
                disabled={tgLoading}
                title="Desvincular Telegram"
                className="cursor-pointer px-3 py-2 rounded-[8px] text-sm text-slate-300/60 hover:text-ember-red hover:bg-ember-red/10 border border-white/8 disabled:opacity-60 transition-colors"
              >
                <Unlink size={13} />
              </button>
            )}
          </div>
        </div>
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
