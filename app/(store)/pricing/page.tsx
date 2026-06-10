import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Check, Zap, Truck, Lock, BarChart2, Star } from "lucide-react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { Waves } from "@/components/ui/wave-background";
import { SubscriptionSuccess } from "@/components/pricing/subscription-success";

export const metadata: Metadata = {
  title: "Planes PRO — DECKLAB",
  description: "Suscríbete al plan PRO de DECKLAB y accede a precios exclusivos, early access y más.",
};

interface ProBenefits {
  earlyAccessHours?: number;
  freeShipping?: boolean;
  exclusiveProducts?: boolean;
  bonusAllowancePercent?: number;
}

const BENEFIT_ICONS = [
  { key: "earlyAccessHours", Icon: Zap, label: (v: number) => v > 0 ? `Early access ${v}h antes` : null },
  { key: "freeShipping", Icon: Truck, label: () => "Envío gratuito" },
  { key: "exclusiveProducts", Icon: Lock, label: () => "Productos exclusivos" },
  { key: "bonusAllowancePercent", Icon: BarChart2, label: (v: number) => v > 0 ? `+${v}% de allowance extra` : null },
] as const;

export default async function PricingPage() {
  const session = await auth();
  const currentTierId = session?.user?.proTierId;

  const tiers = await safeQuery(
    () => prisma.proTier.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    [],
    "proTier.findMany"
  );

  return (
    <div>
      {/* Overlay de activación PRO — solo visible cuando ?subscribed=1 */}
      <Suspense>
        <SubscriptionSuccess />
      </Suspense>
      {/* Hero con wave background */}
      <div className="relative py-20 overflow-hidden">
        <Waves
          strokeColor="rgba(251, 190, 36, 0.25)"
          backgroundColor="transparent"
          className="absolute inset-0 w-full h-full"
        />
        <div className="relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 mb-5">
            <Star size={11} />
            Suscripción PRO
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-snow tracking-tight">
            Elige tu nivel
          </h1>
          <p className="mt-3 text-slate-300 text-base max-w-lg mx-auto leading-relaxed">
            Precios exclusivos, envío gratis, early access y allowance mensual acumulable.
            Facturación bimestral.
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {/* Grid de tiers */}
        {tiers.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            No hay planes disponibles actualmente. Vuelve pronto.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tiers.map((tier, i) => {
              const benefits = (tier.benefits ?? {}) as ProBenefits;
              const isCurrent = tier.id === currentTierId;
              const isRecommended = i === Math.floor(tiers.length / 2);

              const benefitLines: string[] = [];
              for (const { key, label } of BENEFIT_ICONS) {
                const val = benefits[key as keyof ProBenefits];
                if (val) {
                  const text = typeof val === "number"
                    ? label(val as never)
                    : label(1 as never);
                  if (text) benefitLines.push(text);
                }
              }

              return (
                <PricingCard
                  key={tier.id}
                  id={tier.id}
                  name={tier.name}
                  description={tier.description ?? undefined}
                  priceMonthly={Number(tier.priceMonthly)}
                  monthlyAllowance={Number(tier.monthlyAllowance)}
                  stripePriceId={tier.stripePriceId}
                  benefits={benefitLines}
                  isCurrent={isCurrent}
                  isRecommended={isRecommended}
                  isLoggedIn={!!session?.user}
                  isPro={session?.user?.isPro ?? false}
                />
              );
            })}
          </div>
        )}

        {/* Tabla comparativa de beneficios */}
        {tiers.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-snow text-center mb-8">
              Comparativa de beneficios
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium w-48">Beneficio</th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="py-3 px-4 text-center text-snow font-semibold">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Allowance */}
                  <tr className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      <span className="flex items-center gap-2">
                        <BarChart2 size={13} className="text-slate-300/60 shrink-0" />
                        Crédito mensual
                      </span>
                    </td>
                    {tiers.map((tier) => (
                      <td key={tier.id} className="py-3 px-4 text-center text-snow font-medium tabular-nums">
                        {Number(tier.monthlyAllowance).toFixed(0)} &euro;
                      </td>
                    ))}
                  </tr>

                  {/* Early Access */}
                  <tr className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      <span className="flex items-center gap-2">
                        <Zap size={13} className="text-slate-300/60 shrink-0" />
                        Early access
                      </span>
                    </td>
                    {tiers.map((tier) => {
                      const b = (tier.benefits ?? {}) as ProBenefits;
                      const hours = b.earlyAccessHours ?? 0;
                      return (
                        <td key={tier.id} className="py-3 px-4 text-center">
                          {hours > 0
                            ? <span className="text-sky-400 font-medium">{hours}h antes</span>
                            : <span className="text-slate-300/40">&mdash;</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Free Shipping */}
                  <tr className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      <span className="flex items-center gap-2">
                        <Truck size={13} className="text-slate-300/60 shrink-0" />
                        Envío gratuito
                      </span>
                    </td>
                    {tiers.map((tier) => {
                      const b = (tier.benefits ?? {}) as ProBenefits;
                      return (
                        <td key={tier.id} className="py-3 px-4 text-center">
                          {b.freeShipping
                            ? <Check size={15} className="text-mint-signal mx-auto" />
                            : <span className="text-slate-300/40">&mdash;</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Exclusive Products */}
                  <tr className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      <span className="flex items-center gap-2">
                        <Lock size={13} className="text-slate-300/60 shrink-0" />
                        Productos exclusivos
                      </span>
                    </td>
                    {tiers.map((tier) => {
                      const b = (tier.benefits ?? {}) as ProBenefits;
                      return (
                        <td key={tier.id} className="py-3 px-4 text-center">
                          {b.exclusiveProducts
                            ? <Check size={15} className="text-mint-signal mx-auto" />
                            : <span className="text-slate-300/40">&mdash;</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Bonus Allowance */}
                  <tr className="hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      <span className="flex items-center gap-2">
                        <BarChart2 size={13} className="text-slate-300/60 shrink-0" />
                        Crédito extra
                      </span>
                    </td>
                    {tiers.map((tier) => {
                      const b = (tier.benefits ?? {}) as ProBenefits;
                      const bonus = b.bonusAllowancePercent ?? 0;
                      return (
                        <td key={tier.id} className="py-3 px-4 text-center">
                          {bonus > 0
                            ? <span className="text-amber-400 font-medium">+{bonus}%</span>
                            : <span className="text-slate-300/40">&mdash;</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-snow text-center mb-8">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                q: "¿Cómo funciona el allowance mensual?",
                a: "El allowance es un saldo mensual que puedes gastar comprando productos al precio PRO. Si no lo usas todo, se acumula al siguiente mes. Nunca se pierde.",
              },
              {
                q: "¿Cuándo se cobra la suscripción?",
                a: "La suscripción se factura cada 2 meses (bimestral). En la web mostramos el precio mensual equivalente para facilitar la comparación.",
              },
              {
                q: "¿Puedo cancelar en cualquier momento?",
                a: "Existe una permanencia mínima de 2 meses (1 ciclo de facturación). Tras ese período, puedes cancelar cuando quieras desde tu perfil.",
              },
              {
                q: "¿Qué pasa si cancelo?",
                a: "Mantendrás el acceso PRO hasta el final del ciclo de facturación ya pagado. No se realizan reembolsos.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-graphite-700/40 border border-white/8 rounded-[11px] p-4">
                <p className="text-sm font-semibold text-snow mb-2">{q}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-300 mb-2">
            ¿Aún no eres miembro de la comunidad DECKLAB?
          </p>
          <Link
            href="/login"
            className="cursor-pointer text-sm text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
          >
            Inicia sesión con Telegram para continuar
          </Link>
        </div>
      </div>
    </div>
  );
}
