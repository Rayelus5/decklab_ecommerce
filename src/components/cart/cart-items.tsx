"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CartItems() {
    const { items, removeItem, updateQuantity } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-[rgba(186,214,247,0.03)] rounded-[16px] border border-white/5 shadow-subtle-4">
                <p className="text-whisper-blue text-body mb-4">Tu carrito está vacío.</p>
                <Link href="/products" className="text-ghost-white underline hover:text-celestial-light transition-colors">
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {items.map((item) => {
                const hasProPrice = item.pricePro !== null;
                const savings = hasProPrice ? (item.price - (item.pricePro || 0)) * item.quantity : 0;

                return (
                    <Card key={item.variantId} variant="default" className="flex gap-4 sm:gap-6 p-4 bg-[rgba(186,214,247,0.01)] hover:bg-[rgba(186,214,247,0.03)] transition-colors border-white/5">
                        {/* Imagen */}
                        <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-[8px] bg-[rgba(0,0,0,0.5)] border border-white/5 shadow-subtle-5">
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
                                        <h3 className="text-subheading font-medium text-ghost-white">
                                            <Link href={`/products/${item.productId}`} className="hover:underline hover:text-celestial-light transition-colors">
                                                {item.title}
                                            </Link>
                                        </h3>
                                        <p className="text-caption text-arctic-mist mt-1">{item.variantTitle}</p>
                                    </div>

                                    {/* Precio Unitario */}
                                    <div className="text-right">
                                        <p className="text-subheading font-bold text-ghost-white">{item.price.toFixed(2)}€</p>
                                        {hasProPrice && (
                                            <div className="flex items-center justify-end gap-1 text-caption text-neon-violet font-medium mt-1">
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
                                    <div className="flex items-center rounded-[4px] border border-white/10 bg-[rgba(199,211,234,0.06)]">
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                            className="p-1.5 hover:bg-white/10 rounded-l-[4px] text-ghost-white transition disabled:opacity-30"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-caption font-medium text-ghost-white font-dotdigital">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            className="p-1.5 hover:bg-white/10 rounded-r-[4px] text-ghost-white transition disabled:opacity-30"
                                            disabled={item.quantity >= item.maxStock}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.variantId)}
                                        className="text-whisper-blue hover:text-red-400 text-caption flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Eliminar
                                    </button>
                                </div>

                                {/* Subtotal del item */}
                                <div className="text-right">
                                    {savings > 0 && (
                                        <p className="text-caption text-[#4ade80] mb-0.5 font-medium">Ahorro pot. PRO: -{savings.toFixed(2)}€</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}