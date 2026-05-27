import { PrismaClient } from "@prisma/client";
import { Check, ShieldCheck, Zap, Info } from "lucide-react";
import SubscribeButton from "@/components/pricing/subscribe-button";
import { cn } from "@/components/ui/button";

const prisma = new PrismaClient();

async function getTiers() {
    return await prisma.proTier.findMany({
        orderBy: { priceMonthly: "asc" },
    });
}

export default async function PricingPage() {
    const tiers = await getTiers();

    return (
        <div className="min-h-screen py-20 px-4">

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill border border-neon-violet/30 bg-neon-violet/10 text-caption font-bold text-neon-violet animate-in fade-in slide-in-from-bottom-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>MEMBRESÍA DECKLAB PRO</span>
                </div>
                <h1 className="text-display md:text-display-xl font-aeonikpro font-medium text-ghost-white">
                    Elige tu nivel de poder
                </h1>
                <p className="text-body-lg text-whisper-blue max-w-xl mx-auto leading-relaxed">
                    Desbloquea precios de mayorista. Tu suscripción define cuánto puedes gastar
                    con descuento cada mes.
                </p>
            </div>

            {/* Grid de Precios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 container mx-auto max-w-6xl">
                {tiers.map((tier, index) => {
                    const isPopular = index === 2;

                    return (
                        <div
                            key={tier.id}
                            className={cn(
                                "relative flex flex-col p-5 rounded-[16px] border transition-all duration-300",
                                isPopular
                                    ? "bg-[rgba(102,58,243,0.08)] border-neon-violet/40 ring-1 ring-neon-violet/20 shadow-[0_0_40px_rgba(102,58,243,0.15),0_0_0_1px_rgba(102,58,243,0.2)]"
                                    : "bg-[rgba(186,214,247,0.03)] border-[rgba(186,215,247,0.1)] hover:border-[rgba(186,215,247,0.2)] hover:bg-[rgba(186,214,247,0.05)]"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center bg-neon-violet text-ghost-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_12px_rgba(102,58,243,0.4)] whitespace-nowrap">
                                        Recomendado
                                    </span>
                                </div>
                            )}

                            {/* Nombre y precio mensual */}
                            <div className="mb-4 mt-1">
                                <h3 className={cn(
                                    "text-body font-medium mb-2",
                                    isPopular ? "text-ghost-white" : "text-arctic-mist"
                                )}>
                                    {tier.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[32px] font-aeonikpro font-medium leading-none text-ghost-white">
                                        {Number(tier.priceMonthly).toFixed(2)}€
                                    </span>
                                    <span className="text-caption text-whisper-blue ml-1">/mes</span>
                                </div>
                            </div>

                            {/* Capacidad PRO */}
                            <div className="mb-4 p-3 rounded-[10px] bg-[rgba(186,214,247,0.05)] border border-[rgba(186,215,247,0.1)]">
                                <div className="flex items-center gap-1.5 mb-1.5 text-caption font-bold text-neon-violet uppercase tracking-wider">
                                    <Zap className="w-3 h-3" />
                                    <span>Capacidad PRO</span>
                                </div>
                                <p className="text-[22px] font-aeonikpro font-medium leading-none text-ghost-white">
                                    {Number(tier.monthlyAllowance)}€
                                    <span className="text-caption font-normal text-whisper-blue ml-1">+ envío</span>
                                </p>
                                <p className="text-caption text-interstellar-gray mt-1.5 leading-snug">
                                    Límite mensual con precio PRO.
                                </p>
                            </div>

                            {/* Beneficios */}
                            <ul className="flex-1 space-y-2.5 mb-5">
                                <li className="flex gap-2.5 items-start">
                                    <Check className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5 stroke-[2.5]" />
                                    <span className="text-body text-ghost-white">Precios PRO desbloqueados</span>
                                </li>
                                <li className="flex gap-2.5 items-start">
                                    <Check className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5 stroke-[2.5]" />
                                    <span className="text-body text-whisper-blue">Saldo acumulable mensual</span>
                                </li>
                                {index >= 2 && (
                                    <li className="flex gap-2.5 items-start">
                                        <Check className="w-4 h-4 text-neon-violet flex-shrink-0 mt-0.5 stroke-[2.5]" />
                                        <span className="text-body text-whisper-blue">Prioridad en lanzamientos</span>
                                    </li>
                                )}
                                {index >= 4 && (
                                    <li className="flex gap-2.5 items-start">
                                        <Check className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                                        <span className="text-body font-medium text-ghost-white">Reservas Exclusivas</span>
                                    </li>
                                )}
                                <li className="flex gap-2.5 items-start">
                                    <Info className="w-3.5 h-3.5 text-interstellar-gray flex-shrink-0 mt-0.5" />
                                    <span className="text-caption text-interstellar-gray">Permanencia mínima 2 meses</span>
                                </li>
                            </ul>

                            <SubscribeButton
                                priceId={tier.stripePriceId}
                                tierId={tier.id}
                                isPopular={isPopular}
                            />
                        </div>
                    );
                })}
            </div>

            {/* FAQ */}
            <div className="max-w-2xl mx-auto mt-20 text-center space-y-5 border-t border-[rgba(186,215,247,0.1)] pt-12">
                <h3 className="text-subheading font-medium text-ghost-white">¿Cómo funciona el saldo PRO?</h3>
                <p className="text-body text-whisper-blue leading-relaxed">
                    El &ldquo;Saldo Mensual&rdquo; es tu{" "}
                    <strong className="text-arctic-mist font-medium">límite de compra con descuento</strong>.
                    Si tienes el Nivel 1, puedes comprar hasta 50€ en productos pagando el precio PRO.
                    Si quieres comprar más ese mes, pagarás el precio normal o podrás subir de nivel.
                </p>
            </div>
        </div>
    );
}
