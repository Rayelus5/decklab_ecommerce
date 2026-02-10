"use client";

import Link from "next/link";
import { User, ProTier } from "@prisma/client";
import { ShieldCheck, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProStatusCardProps {
    user: User & { proTier: ProTier | null };
}

export default function ProStatusCard({ user }: ProStatusCardProps) {
    const isPro = user.isPro && user.proTier;

    if (!isPro) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-8 text-center">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Estado: Miembro Estándar</h2>
                    <p className="text-muted-foreground max-w-md mb-6">
                        Estás pagando el precio completo en todos los productos.
                        Activa tu membresía PRO y empieza a ahorrar hoy mismo.
                    </p>
                    <Link
                        href="/pricing"
                        className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition shadow-lg shadow-white/5"
                    >
                        Ver Planes PRO
                    </Link>
                </div>
            </div>
        );
    }

    // Cálculos para la barra de progreso
    const maxAllowance = Number(user.proTier!.monthlyAllowance);
    const currentBalance = Number(user.proAllowanceBalance);

    // Porcentaje restante
    const percentage = Math.min(100, Math.max(0, (currentBalance / maxAllowance) * 100));

    // Color según estado (Verde > 50%, Amarillo > 20%, Rojo < 20%)
    let progressColor = "bg-green-500";
    if (percentage < 50) progressColor = "bg-yellow-500";
    if (percentage < 20) progressColor = "bg-red-500";

    return (
        <div className="relative overflow-hidden rounded-2xl border border-pro/30 bg-card p-6 md:p-8">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-pro/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pro text-white uppercase tracking-wider">
                                Activo
                            </span>
                            <span className="text-xs text-muted-foreground">Renueva mensualmente</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                            {user.proTier!.name}
                            <ShieldCheck className="w-6 h-6 text-pro" />
                        </h2>
                    </div>

                    <div className="text-right">
                        <Link
                            href="/pricing"
                            className="text-xs font-medium text-white hover:text-pro underline decoration-white/30 hover:decoration-pro transition-colors"
                        >
                            Cambiar Plan
                        </Link>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-black/40 rounded-xl p-6 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                Saldo PRO Disponible
                            </p>
                            <p className="text-4xl font-bold text-white tracking-tight">
                                {currentBalance.toFixed(2)}€
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Límite Mensual</p>
                            <p className="text-lg font-medium text-white">{maxAllowance.toFixed(0)}€</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden mt-4">
                        <div
                            className={cn("h-full transition-all duration-1000 ease-out relative", progressColor)}
                            style={{ width: `${percentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                        <span>0%</span>
                        <span>{percentage.toFixed(0)}% Restante</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Low Balance Alert / Upsell */}
                {percentage < 20 && (
                    <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">¡Tu saldo se está agotando!</p>
                            <p className="mb-3 opacity-90">
                                Te queda poco cupo para comprar a precio PRO este mes.
                                Si necesitas hacer un pedido grande, considera subir de nivel.
                            </p>
                            <Link href="/pricing" className="text-white bg-yellow-600/50 hover:bg-yellow-600 px-3 py-1.5 rounded text-xs font-bold transition">
                                Mejorar Plan Ahora
                            </Link>
                        </div>
                    </div>
                )}

                {/* Accumulation Tip */}
                {percentage > 80 && (
                    <div className="mt-6 flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                        <TrendingUp className="w-5 h-5 flex-shrink-0" />
                        <p>
                            ¡Genial! Recuerda que el saldo no utilizado se acumula para el siguiente mes (Pro Futuro).
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}