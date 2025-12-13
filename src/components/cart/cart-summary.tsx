"use client";

import { useCartStore } from "@/lib/store/cart";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Info } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CartSummary() {
    const { items, getTotalPrice, getTotalProPrice } = useCartStore();
    const { data: session } = useSession();

    const user = session?.user;
    const isPro = user?.isPro;

    // Cálculos
    const subtotal = getTotalPrice();
    const subtotalPro = getTotalProPrice();
    const potentialSavings = subtotal - subtotalPro;

    // Cupo PRO que se consumiría (Precio PRO de los items que lo tengan)
    // Nota: Según tu lógica, el "coste" del saldo es el precio PRO del producto.
    const proAllowanceCost = items.reduce((acc, item) => {
        if (item.pricePro !== null) {
            return acc + (item.pricePro * item.quantity);
        }
        return acc;
    }, 0);

    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl bg-card border border-white/5 p-6 space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-white">Resumen del Pedido</h2>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-white">{subtotal.toFixed(2)}€</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                    <span>Envío estimado</span>
                    <span className="text-xs">Calculado en checkout</span>
                </div>

                {/* Lógica Visual PRO */}
                {potentialSavings > 0 && (
                    <div className="pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-pro">
                            <span className="flex items-center gap-1.5 font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                Precio para PROs
                            </span>
                            <span className="font-bold text-lg">{subtotalPro.toFixed(2)}€</span>
                        </div>

                        <div className="flex justify-between text-xs text-green-400 mt-1">
                            <span>Ahorro total</span>
                            <span>-{potentialSavings.toFixed(2)}€</span>
                        </div>

                        {/* Info sobre consumo de saldo */}
                        {isPro && (
                            <div className="mt-3 bg-pro/10 border border-pro/20 rounded-lg p-3 text-xs text-pro-foreground/80">
                                <p className="flex gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        Si pagas con tarifa PRO, consumirás <strong>{proAllowanceCost.toFixed(2)}€</strong> de tu saldo mensual.
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {!isPro && potentialSavings > 0 && (
                    <div className="bg-gradient-to-r from-pro/20 to-purple-900/20 p-3 rounded-lg border border-pro/30 text-xs">
                        <p className="text-white mb-2">
                            ¡Estás pagando <strong>{potentialSavings.toFixed(2)}€ de más</strong>!
                        </p>
                        <Link href="/pricing" className="block text-center bg-pro text-white py-1.5 rounded font-bold hover:bg-pro/90 transition">
                            Hazte PRO y ahorra
                        </Link>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-base font-medium text-white">Total estimado</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white">
                            {isPro ? subtotalPro.toFixed(2) : subtotal.toFixed(2)}€
                        </span>
                        {isPro && <p className="text-xs text-muted-foreground">(Precio PRO aplicado)</p>}
                    </div>
                </div>

                <Link
                    href="/checkout"
                    className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    Tramitar Pedido <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-[10px] text-muted-foreground mt-3">
                    Impuestos incluidos. Gastos de envío calculados en el siguiente paso.
                </p>
            </div>
        </div>
    );
}