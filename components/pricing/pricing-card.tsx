"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  monthlyAllowance: number;
  stripePriceId: string;
  benefits: string[];
  isCurrent: boolean;
  isRecommended: boolean;
  isLoggedIn: boolean;
  isPro: boolean;
}

export function PricingCard({
  id,
  name,
  description,
  priceMonthly,
  monthlyAllowance,
  benefits,
  isCurrent,
  isRecommended,
  isLoggedIn,
  isPro,
}: PricingCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar la suscripción");
        return;
      }

      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChange() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al cambiar el plan");
        return;
      }

      toast.success("Plan actualizado correctamente");
      router.refresh();
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  const billingTotal = (priceMonthly * 2).toFixed(2).replace(".", ",");

  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-4xl border-3 p-6 transition-all",
        isCurrent
          ? "border-amber-500/40 bg-amber-500/5"
          : isRecommended
            ? "border-ash-50/25 bg-graphite-700/60 shadow-2xl"
            : "border-white/8 bg-graphite-700/40 hover:border-white/15"
      )}
    >
      {/* Badge */}
      {isRecommended && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-ash-50 text-graphite-700 text-xs font-bold rounded-full shadow">
            Recomendado
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-amber-500 text-graphite-700 text-xs font-bold rounded-full shadow">
            Plan actual
          </span>
        </div>
      )}

      {/* Nombre y descripción */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-snow">{name}</h3>
        {description && (
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Precio */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-snow tabular-nums">
            {priceMonthly.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-lg text-amber-200">&euro;</span>
          <span className="text-slate-300 text-sm">/mes</span>
        </div>
        <p className="text-xs text-slate-300/70 mt-1">
          {billingTotal} &euro; cada 2 meses &middot; m&iacute;nimo 2 meses
        </p>
      </div>

      {/* Allowance */}
      <div className="mb-5 bg-graphite-600/50 border border-white/8 rounded-[10px] px-3 py-2.5">
        <p className="text-xs text-slate-300">Allowance mensual</p>
        <p className="text-base font-bold text-snow tabular-nums mt-0.5">
          {monthlyAllowance.toFixed(0)} &euro;
        </p>
      </div>

      {/* Beneficios */}
      {benefits.length > 0 && (
        <ul className="flex flex-col gap-2 mb-6">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
              <Check size={14} className="text-mint-signal shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <div className="mt-auto">
        {isCurrent ? (
          <Button variant="outline" fullWidth disabled>
            Plan actual
          </Button>
        ) : isPro ? (
          <Button
            variant="outline"
            fullWidth
            onClick={handleChange}
            loading={loading}
          >
            Cambiar a este plan
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button
            fullWidth
            onClick={handleSubscribe}
            loading={loading}
          >
            Suscribirse
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
