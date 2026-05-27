"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "next-auth/react";
import {
  User,
  Lock,
  Crown,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Schemas ───────────────────────────────────────────────────────────────

const nameSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(80),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type NameFormData = z.infer<typeof nameSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

interface SettingsClientProps {
  name: string | null;
  email: string;
  hasPassword: boolean;
  isPro: boolean;
  proSince: Date | null;
  proTierName: string | null;
  subscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
}

// ─── Name form ─────────────────────────────────────────────────────────────

function NameForm({ currentName }: { currentName: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: currentName ?? "" },
  });

  async function onSubmit(data: NameFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al actualizar");
        return;
      }
      toast.success("Nombre actualizado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Nombre</label>
        <input
          {...register("name")}
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
        {errors.name && (
          <p className="text-xs text-ember-red mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Button type="submit" loading={loading} size="sm">
          <Check size={13} />
          Guardar nombre
        </Button>
      </div>
    </form>
  );
}

// ─── Password form ─────────────────────────────────────────────────────────

function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(data: PasswordFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al actualizar la contraseña");
        return;
      }
      toast.success("Contraseña actualizada");
      reset();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Current password */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Contraseña actual</label>
        <div className="relative">
          <input
            {...register("currentPassword")}
            type={showCurrent ? "text" : "password"}
            className="w-full px-3 py-2 pr-10 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300/50 hover:text-slate-300"
          >
            {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-ember-red mt-1">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New password */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Nueva contraseña</label>
        <div className="relative">
          <input
            {...register("newPassword")}
            type={showNew ? "text" : "password"}
            className="w-full px-3 py-2 pr-10 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300/50 hover:text-slate-300"
          >
            {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-ember-red mt-1">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Confirmar contraseña</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-ember-red mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <Button type="submit" loading={loading} size="sm">
          <Check size={13} />
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}

// ─── Subscription section ──────────────────────────────────────────────────

function SubscriptionSection({
  isPro,
  proSince,
  proTierName,
  cancelAtPeriodEnd,
}: {
  isPro: boolean;
  proSince: Date | null;
  proTierName: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function handleCancelSubscription() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo cancelar la suscripción");
        return;
      }
      toast.success(json.message);
      setConfirmCancel(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-snow">Sin plan PRO activo</p>
          <p className="text-xs text-slate-300 mt-0.5">
            Suscríbete para acceder a precios exclusivos y allowance mensual.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          Ver planes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">{proTierName}</p>
          </div>
          {proSince && (
            <p className="text-xs text-slate-300 mt-1">
              Activo desde{" "}
              {new Date(proSince).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {cancelAtPeriodEnd && (
            <p className="text-xs text-ember-red mt-1">
              Cancelación programada al final del período actual
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          Cambiar plan
        </Button>
      </div>

      {!cancelAtPeriodEnd && (
        <>
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-xs text-slate-300/60 hover:text-ember-red transition-colors text-left"
            >
              Cancelar suscripción
            </button>
          ) : (
            <div className="bg-ember-red/8 border border-ember-red/20 rounded-[10px] p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-ember-red mt-0.5 shrink-0" />
                <p className="text-xs text-slate-300">
                  La permanencia mínima es de 2 meses. Si ya la has cumplido, mantendrás
                  el acceso PRO hasta el final del período actual.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSubscription}
                  loading={loading}
                  className="text-ember-red border-ember-red/30 hover:bg-ember-red/10"
                >
                  Confirmar cancelación
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmCancel(false)}
                  disabled={loading}
                >
                  Volver
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function SettingsClient({
  name,
  email,
  hasPassword,
  isPro,
  proSince,
  proTierName,
  cancelAtPeriodEnd,
}: SettingsClientProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Profile info */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
          <User size={14} className="text-slate-300" />
          Información personal
        </h2>
        <div className="text-xs text-slate-300">
          Email:{" "}
          <span className="text-snow font-medium">{email}</span>
        </div>
        <NameForm currentName={name} />
      </div>

      {/* Password */}
      {hasPassword && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
            <Lock size={14} className="text-slate-300" />
            Contraseña
          </h2>
          <PasswordForm />
        </div>
      )}

      {!hasPassword && (
        <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5">
          <h2 className="text-sm font-semibold text-snow flex items-center gap-2 mb-2">
            <Lock size={14} className="text-slate-300" />
            Contraseña
          </h2>
          <p className="text-xs text-slate-300">
            Esta cuenta fue creada con Google o Telegram. No puedes cambiar la contraseña desde aquí.
          </p>
        </div>
      )}

      {/* Subscription */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow flex items-center gap-2">
          <Crown size={14} className="text-slate-300" />
          Suscripción PRO
        </h2>
        <SubscriptionSection
          isPro={isPro}
          proSince={proSince}
          proTierName={proTierName}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </div>

      {/* Sign out */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5">
        <h2 className="text-sm font-semibold text-snow mb-3 flex items-center gap-2">
          <LogOut size={14} className="text-slate-300" />
          Sesión
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={13} />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
