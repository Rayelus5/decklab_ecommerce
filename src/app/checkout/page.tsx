"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CheckoutForm from "@/components/checkout/checkout-form";
import { ShippingRate } from "@prisma/client";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { items, getTotalPrice, getTotalProPrice } = useCartStore();

    // Estado local para el envío seleccionado
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);

    // Redirección si no está logueado o carrito vacío
    if (status === "unauthenticated") {
        router.push("/login?callbackUrl=/checkout");
        return null;
    }

    if (items.length === 0 && status === "authenticated") {
        router.push("/products");
        return null;
    }

    const isPro = session?.user?.isPro;
    const subtotal = isPro ? getTotalProPrice() : getTotalPrice();
    const total = subtotal + shippingCost;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-display font-aeonikpro font-medium text-ghost-white mb-8">Tramitar Pedido</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* IZQUIERDA: FORMULARIO */}
                <div className="lg:col-span-7">
                    <CheckoutForm
                        onRateSelected={(rate) => {
                            setShippingRate(rate);
                            setShippingCost(rate ? Number(rate.price) : 0);
                        }}
                    />
                </div>

                {/* DERECHA: RESUMEN DE ORDEN */}
                <div className="lg:col-span-5">
                    <Card variant="glassy-feature" className="sticky top-24 space-y-6">
                        <CardTitle className="text-heading">Tu Pedido</CardTitle>

                        {/* Lista mini de items */}
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {items.map((item) => (
                                <div key={item.variantId} className="flex gap-3">
                                    <div className="relative h-12 w-12 rounded-[6px] bg-[rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex-shrink-0">
                                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-body font-medium text-ghost-white line-clamp-1">{item.title}</p>
                                        <p className="text-caption text-arctic-mist">Cant: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-body font-bold text-ghost-white">
                                            {isPro && item.pricePro
                                                ? (item.pricePro * item.quantity).toFixed(2)
                                                : (item.price * item.quantity).toFixed(2)
                                            }€
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        {/* Totales */}
                        <div className="space-y-2 text-body">
                            <div className="flex justify-between text-arctic-mist">
                                <span>Subtotal</span>
                                <span className="text-ghost-white">{subtotal.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-arctic-mist">
                                <span>Envío {shippingRate && `(${shippingRate.name})`}</span>
                                <span className={shippingCost === 0 ? "text-yellow-500" : "text-ghost-white"}>
                                    {shippingCost === 0 ? "Pendiente" : `${shippingCost.toFixed(2)}€`}
                                </span>
                            </div>
                            {isPro && (
                                <div className="flex items-center gap-2 text-caption text-neon-violet mt-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Precio PRO aplicado</span>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-white/5 my-4" />

                        <div className="flex justify-between items-end">
                            <span className="text-subheading font-bold text-ghost-white">Total</span>
                            <span className="text-heading font-bold text-ghost-white">{total.toFixed(2)}€</span>
                        </div>

                        {/* El botón de Pagar estará en el formulario de la izquierda, pero este resumen es visual */}
                    </Card>
                </div>
            </div>
        </div>
    );
}