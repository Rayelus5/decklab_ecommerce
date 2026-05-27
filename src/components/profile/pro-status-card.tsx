"use client";

import Link from "next/link";
import { User, ProTier } from "@prisma/client";
import { ShieldCheck, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/components/ui/button";

interface ProStatusCardProps {
    user: User & { proTier: ProTier | null };
}

export default function ProStatusCard({ user }: ProStatusCardProps) {
    const isPro = user.isPro && user.proTier;

    if (!isPro) {
        return (
            <div className="relative overflow-hidden rounded-[16px] bg-[rgba(186,214,247,0.03)] border border-[rgba(186,215,247,0.12)] shadow-subtle-4 p-8 text-center">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-neon-violet/10 blur-3xl rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="h-16 w-16 bg-[rgba(186,214,247,0.06)] border border-[rgba(186,215,247,0.12)] rounded-full flex items-center justify-center mb-5 text-whisper-blue">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-heading font-aeonikpro font-medium text-ghost-white mb-2">
                        Estado: Miembro Estándar
                    </h2>
                    <p className="text-body text-whisper-blue max-w-md mb-6">
                        Estás pagando el precio completo en todos los productos.
                        Activa tu membresía PRO y empieza a ahorrar hoy mismo.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-neon-violet text-ghost-white font-medium text-body rounded-md hover:bg-neon-violet/90 transition-colors"
                    >
                        Ver Planes PRO
                    </Link>
                </div>
            </div>
        );
    }

    const maxAllowance = Number(user.proTier!.monthlyAllowance);
    const currentBalance = Number(user.proAllowanceBalance);
    const percentage = Math.min(100, Math.max(0, (currentBalance / maxAllowance) * 100));

    let progressColor = "bg-[#4ade80]";
    if (percentage < 50) progressColor = "bg-yellow-500";
    if (percentage < 20) progressColor = "bg-red-500";

    return (
        <div className="relative overflow-hidden rounded-[16px] border border-neon-violet/25 bg-[rgba(186,214,247,0.03)] shadow-subtle-4 p-6 md:p-8">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-neon-violet/8 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-[4px] text-caption font-bold bg-neon-violet text-ghost-white uppercase tracking-wider">
                                Activo
                            </span>
                            <span className="text-caption text-whisper-blue">Renueva mensualmente</span>
                        </div>
                        <h2 className="text-heading font-aeonikpro font-medium text-ghost-white flex items-center gap-2">
                            {user.proTier!.name}
                            <ShieldCheck className="w-5 h-5 text-neon-violet" />
                        </h2>
                    </div>

                    <Link
                        href="/pricing"
                        className="text-caption font-medium text-whisper-blue hover:text-neon-violet underline decoration-[rgba(186,215,247,0.3)] hover:decoration-neon-violet/50 transition-colors"
                    >
                        Cambiar Plan
                    </Link>
                </div>

                {/* Balance */}
                <div className="bg-[rgba(186,214,247,0.02)] rounded-[12px] p-5 border border-[rgba(186,215,247,0.08)]">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-caption text-whisper-blue mb-1.5 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                Saldo PRO Disponible
                            </p>
                            <p className="text-display font-dotdigital text-ghost-white">
                                {currentBalance.toFixed(2)}€
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-caption text-whisper-blue">Límite Mensual</p>
                            <p className="text-subheading font-medium text-arctic-mist">{maxAllowance.toFixed(0)}€</p>
                        </div>
                    </div>

                    <div className="h-3 w-full bg-[rgba(186,215,247,0.08)] rounded-full overflow-hidden mt-3">
                        <div
                            className={cn("h-full transition-all duration-1000 ease-out relative rounded-full", progressColor)}
                            style={{ width: `${percentage}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        </div>
                    </div>

                    <div className="mt-2 flex justify-between text-caption text-interstellar-gray uppercase font-bold">
                        <span>0%</span>
                        <span>{percentage.toFixed(0)}% Restante</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Low Balance Alert */}
                {percentage < 20 && (
                    <div className="mt-5 flex items-start gap-3 p-4 rounded-[10px] bg-yellow-500/8 border border-yellow-500/20 text-yellow-200">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-400" />
                        <div>
                            <p className="text-body font-medium mb-1">¡Tu saldo se está agotando!</p>
                            <p className="text-caption text-yellow-200/80 mb-3">
                                Te queda poco cupo para comprar a precio PRO este mes.
                            </p>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center px-3 py-1.5 text-caption font-bold bg-yellow-600/40 hover:bg-yellow-600/70 text-white rounded-[6px] transition-colors"
                            >
                                Mejorar Plan Ahora
                            </Link>
                        </div>
                    </div>
                )}

                {/* Accumulation Tip */}
                {percentage > 80 && (
                    <div className="mt-5 flex items-center gap-3 p-4 rounded-[10px] bg-[rgba(186,215,247,0.04)] border border-[rgba(186,215,247,0.1)] text-arctic-mist">
                        <TrendingUp className="w-4 h-4 flex-shrink-0 text-celestial-light" />
                        <p className="text-body">
                            ¡Genial! El saldo no utilizado se acumula para el siguiente mes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
