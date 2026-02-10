import { PrismaClient } from "@prisma/client";
import { Check, ShieldCheck, Zap, Info } from "lucide-react";
import SubscribeButton from "@/components/pricing/subscribe-button";
import { cn } from "@/lib/utils";

const prisma = new PrismaClient();

async function getTiers() {
    return await prisma.proTier.findMany({
        orderBy: { priceMonthly: 'asc' },
    });
}

export default async function PricingPage() {
    const tiers = await getTiers();

    return (
        <div className="min-h-screen py-20 px-4">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pro/30 bg-pro/10 text-xs font-bold text-pro mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>MEMBRESÍA DECKLAB PRO</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                    Elige tu nivel de poder
                </h1>
                <p className="text-lg text-muted-foreground">
                    Desbloquea precios de mayorista. Tu suscripción define cuánto puedes gastar
                    con descuento cada mes. Cuanto más alto el nivel, más ahorras.
                </p>
            </div>

            {/* Grid de Precios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 container mx-auto">
                {tiers.map((tier, index) => {
                    // Destacamos el Nivel 3 (índice 2) como "Recomendado"
                    const isPopular = index === 2;

                    return (
                        <div
                            key={tier.id}
                            className={cn(
                                "relative flex flex-col p-6 rounded-2xl border transition-all duration-300",
                                isPopular
                                    ? "bg-card border-pro/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] scale-105 z-10"
                                    : "bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/40"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-pro text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                        Recomendado
                                    </span>
                                </div>
                            )}

                            {/* Título y Precio */}
                            <div className="mb-6">
                                <h3 className={cn("text-lg font-bold mb-2", isPopular ? "text-white" : "text-muted-foreground")}>
                                    {tier.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">
                                        {Number(tier.priceMonthly).toFixed(2)}€
                                    </span>
                                    <span className="text-sm text-muted-foreground">/mes</span>
                                </div>
                            </div>

                            {/* Lógica del Cupo (Allowance) */}
                            <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-pro uppercase tracking-wider">
                                    <Zap className="w-3 h-3" /> Capacidad PRO
                                </div>
                                <p className="text-2xl font-bold text-white">
                                    {Number(tier.monthlyAllowance)}€ <span className="text-sm font-normal text-muted-foreground">+ envío</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                                    Este es el valor máximo en productos PRO que puedes comprar cada mes.
                                </p>
                            </div>

                            {/* Lista de Beneficios */}
                            <ul className="flex-1 space-y-4 mb-8 text-sm text-muted-foreground">
                                <li className="flex gap-3">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span className="text-white">Desbloquea PRECIOS PRO</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span>Acumula saldo no gastado (Pro Futuro)</span>
                                </li>
                                {index >= 2 && (
                                    <li className="flex gap-3">
                                        <Check className="w-4 h-4 text-pro flex-shrink-0" />
                                        <span>Prioridad en nuevos lanzamientos</span>
                                    </li>
                                )}
                                {index >= 4 && (
                                    <li className="flex gap-3">
                                        <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                        <span className="font-medium text-white">Acceso a Reservas Exclusivas</span>
                                    </li>
                                )}
                                <li className="flex gap-3 items-start">
                                    <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span className="text-xs">Permanencia mínima 2 meses</span>
                                </li>
                            </ul>

                            {/* Botón de Acción */}
                            <SubscribeButton
                                priceId={tier.stripePriceId}
                                tierId={tier.id}
                                isPopular={isPopular}
                            />
                        </div>
                    );
                })}
            </div>

            {/* FAQ Rápido */}
            <div className="max-w-2xl mx-auto mt-20 text-center space-y-8 border-t border-white/10 pt-10">
                <h3 className="text-xl font-bold text-white">¿Cómo funciona el saldo PRO?</h3>
                <p className="text-muted-foreground">
                    El "Saldo Mensual" no es dinero que te regalamos, es tu <strong>límite de compra con descuento</strong>.
                    Si tienes el Nivel 1, puedes comprar hasta 50€ en productos pagando el precio PRO.
                    Si quieres comprar más ese mes, pagarás el precio normal o podrás subir de nivel.
                </p>
            </div>
        </div>
    );
}