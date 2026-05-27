"use client";

import { useCartStore } from "@/lib/store/cart";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CartSummary() {
    const { items, getTotalPrice, getTotalProPrice } = useCartStore();
    const { data: session } = useSession();

    const user = session?.user;
    const isPro = user?.isPro;

    // Cálculos
    const subtotal = getTotalPrice();
    const subtotalPro = getTotalProPrice();
    const potentialSavings = subtotal - subtotalPro;

    const proAllowanceCost = items.reduce((acc, item) => {
        if (item.pricePro !== null) {
            return acc + (item.pricePro * item.quantity);
        }
        return acc;
    }, 0);

    if (items.length === 0) return null;

    return (
        <Card variant="glassy-feature" className="space-y-6 sticky top-24 p-6">
            <CardTitle className="text-heading">Resumen del Pedido</CardTitle>

            <div className="space-y-3 text-body">
                <div className="flex justify-between text-arctic-mist">
                    <span>Subtotal</span>
                    <span className="text-ghost-white">{subtotal.toFixed(2)}€</span>
                </div>

                <div className="flex justify-between text-arctic-mist">
                    <span>Envío estimado</span>
                    <span className="text-caption">Calculado en checkout</span>
                </div>

                {/* Lógica Visual PRO */}
                {potentialSavings > 0 && (
                    <div className="pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center text-neon-violet">
                            <span className="flex items-center gap-1.5 font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                Precio para PROs
                            </span>
                            <span className="font-bold text-subheading">{subtotalPro.toFixed(2)}€</span>
                        </div>

                        <div className="flex justify-between text-caption text-[#4ade80] mt-1">
                            <span>Ahorro total</span>
                            <span>-{potentialSavings.toFixed(2)}€</span>
                        </div>

                        {/* Info sobre consumo de saldo */}
                        {isPro && (
                            <div className="mt-3 bg-neon-violet/10 border border-neon-violet/20 rounded-[6px] p-3 text-caption text-arctic-mist">
                                <p className="flex gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        Si pagas con tarifa PRO, consumirás <strong className="text-ghost-white">{proAllowanceCost.toFixed(2)}€</strong> de tu saldo mensual.
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {!isPro && potentialSavings > 0 && (
                    <div className="bg-gradient-to-r from-neon-violet/20 to-transparent p-3 rounded-[6px] border border-neon-violet/30 text-caption">
                        <p className="text-ghost-white mb-2">
                            ¡Estás pagando <strong className="text-celestial-light">{potentialSavings.toFixed(2)}€ de más</strong>!
                        </p>
                        <Link href="/pricing" className="block text-center bg-neon-violet text-white py-1.5 rounded-[999px] font-bold hover:bg-neon-violet/90 transition shadow-subtle-3">
                            Hazte PRO y ahorra
                        </Link>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-body-lg font-medium text-ghost-white">Total estimado</span>
                    <div className="text-right">
                        <span className="text-heading font-bold text-ghost-white">
                            {isPro ? subtotalPro.toFixed(2) : subtotal.toFixed(2)}€
                        </span>
                        {isPro && <p className="text-caption text-arctic-mist">(Precio PRO aplicado)</p>}
                    </div>
                </div>

                <Link href="/checkout" className="w-full">
                    <Button variant="solid-primary" className="w-full flex items-center justify-center gap-2 h-12">
                        Tramitar Pedido <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>

                <p className="text-center text-[10px] font-dotdigital text-whisper-blue mt-3">
                    Impuestos incluidos. Gastos de envío calculados en el siguiente paso.
                </p>
            </div>
        </Card>
    );
}