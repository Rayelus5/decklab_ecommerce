"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

export default function CartItems() {
    const { items, removeItem, updateQuantity } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-muted-foreground mb-4">Tu carrito está vacío.</p>
                <Link href="/products" className="text-white underline hover:text-primary">
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {items.map((item) => {
                // Lógica visual PRO
                const hasProPrice = item.pricePro !== null;
                const savings = hasProPrice ? (item.price - (item.pricePro || 0)) * item.quantity : 0;

                return (
                    <div key={item.variantId} className="flex gap-4 sm:gap-6 p-4 rounded-xl bg-card border border-white/5">
                        {/* Imagen */}
                        <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/20">
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Detalles */}
                        <div className="flex flex-1 flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-white">
                                            <Link href={`/products/${item.productId}`} className="hover:underline">
                                                {item.title}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">{item.variantTitle}</p>
                                    </div>

                                    {/* Precio Unitario */}
                                    <div className="text-right">
                                        <p className="font-bold text-white">{item.price.toFixed(2)}€</p>
                                        {hasProPrice && (
                                            <div className="flex items-center justify-end gap-1 text-xs text-pro font-medium">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>{(item.pricePro!).toFixed(2)}€ PRO</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Controles: Cantidad y Eliminar */}
                            <div className="flex items-end justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center rounded-lg border border-white/10 bg-black/20">
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-white transition disabled:opacity-30"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-white transition disabled:opacity-30"
                                            disabled={item.quantity >= item.maxStock}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.variantId)}
                                        className="text-muted-foreground hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Eliminar
                                    </button>
                                </div>

                                {/* Subtotal del item */}
                                <div className="text-right">
                                    {savings > 0 && (
                                        <p className="text-xs text-green-400 mb-0.5">Ahorro pot. PRO: -{savings.toFixed(2)}€</p>
                                    )}
                                    {/* Aquí mostramos el total base, el cálculo final se hace en el resumen */}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}