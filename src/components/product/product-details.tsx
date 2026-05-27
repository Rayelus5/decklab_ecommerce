"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductImage, ProductVariant } from "@prisma/client";
import { ShieldCheck, ShoppingCart, Check, Minus, Plus, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProductFull = Product & {
    images: ProductImage[];
    variants: ProductVariant[];
};

export default function ProductDetails({ product }: { product: ProductFull }) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCartStore();

    const price = Number(selectedVariant.price);
    const pricePro = selectedVariant.pricePro ? Number(selectedVariant.pricePro) : null;
    const maxStock = selectedVariant.stock;
    const hasStock = maxStock > 0;

    useEffect(() => {
        setQuantity(1);
    }, [selectedVariant.id]);

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => {
            const newVal = prev + delta;
            if (newVal < 1) return 1;
            if (newVal > maxStock) return maxStock;
            return newVal;
        });
    };

    const handleAddToCart = () => {
        if (!hasStock) return;

        addItem({
            variantId: selectedVariant.id,
            productId: product.id,
            title: product.title,
            variantTitle: selectedVariant.title || selectedVariant.sku,
            price: price,
            pricePro: pricePro,
            image: product.images[0]?.url || "",
            quantity: quantity,
            weight: selectedVariant.weight,
            maxStock: maxStock
        });

        toast.success(`Añadidas ${quantity} unidades al carrito`);
        setQuantity(1);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* 1. Galería */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/5 bg-[rgba(0,0,0,0.5)] shadow-subtle-5">
                {product.images[0] && (
                    <Image
                        src={product.images[0].url}
                        alt={product.title}
                        fill
                        className="object-cover"
                        priority
                    />
                )}
            </div>

            {/* 2. Info y Acciones */}
            <div className="flex flex-col justify-center">
                <h1 className="text-display font-aeonikpro font-medium text-ghost-white mb-2">{product.title}</h1>

                {/* Precios */}
                <div className="flex items-end gap-4 mb-6 border-b border-white/5 pb-6">
                    <div>
                        <p className="text-caption font-dotdigital text-whisper-blue uppercase mb-1">Precio estándar</p>
                        <p className={cn("text-heading font-bold", pricePro ? "text-arctic-mist line-through decoration-white/30" : "text-ghost-white")}>
                            {price.toFixed(2)}€
                        </p>
                    </div>

                    {pricePro && (
                        <div>
                            <div className="flex items-center gap-1 text-neon-violet mb-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span className="text-caption font-dotdigital font-bold uppercase">Precio PRO</span>
                            </div>
                            <p className="text-display font-bold text-ghost-white">
                                {pricePro.toFixed(2)}€
                            </p>
                        </div>
                    )}
                </div>

                {/* Selector de Variantes */}
                {product.variants.length > 1 && (
                    <div className="mb-6">
                        <label className="text-body font-medium text-arctic-mist mb-3 block">
                            Opción:
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {product.variants.map((v) => {
                                const isSelected = selectedVariant.id === v.id;
                                const label = v.title || v.sku;
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        className={cn(
                                            "px-4 py-2 rounded-[6px] border text-body transition-all",
                                            isSelected
                                                ? "border-celestial-light bg-[rgba(186,214,247,0.1)] text-ghost-white font-bold"
                                                : "border-white/10 bg-transparent hover:bg-white/5 text-arctic-mist hover:text-ghost-white"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Control de Stock y Cantidad */}
                <div className="mb-8 p-6 rounded-2xl bg-[rgba(186,214,247,0.01)] border border-white/5 shadow-subtle-3">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-body font-medium text-ghost-white">Cantidad</span>
                        <span className={cn("text-caption font-dotdigital", hasStock ? "text-[#4ade80]" : "text-red-400")}>
                            {hasStock ? `${maxStock} disponibles` : "Sin stock"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Selector Numérico */}
                        <div className="flex items-center rounded-[6px] bg-[rgba(199,211,234,0.06)] border border-white/10 p-1">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1 || !hasStock}
                                className="p-2 hover:bg-white/10 rounded-[4px] text-ghost-white disabled:opacity-30 transition"
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <div className="w-12 text-center font-bold text-ghost-white font-dotdigital">
                                {quantity}
                            </div>

                            <button
                                onClick={() => handleQuantityChange(1)}
                                disabled={quantity >= maxStock || !hasStock}
                                className="p-2 hover:bg-white/10 rounded-[4px] text-ghost-white disabled:opacity-30 transition"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Botón Añadir */}
                        <Button
                            onClick={handleAddToCart}
                            disabled={!hasStock}
                            variant="solid-primary"
                            size="lg"
                            className="flex-1"
                        >
                            {hasStock ? (
                                <>
                                    <ShoppingCart className="w-4 h-4" />
                                    Añadir {(quantity * (pricePro || price)).toFixed(2)}€
                                </>
                            ) : (
                                "Agotado"
                            )}
                        </Button>
                    </div>

                    {/* Aviso si intenta añadir más del stock */}
                    {quantity === maxStock && hasStock && (
                        <div className="mt-4 flex items-center gap-2 text-caption text-yellow-500">
                            <AlertCircle className="w-4 h-4" />
                            Has alcanzado el límite de stock disponible.
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="flex flex-col gap-2 text-caption text-whisper-blue">
                    <p className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#4ade80]" />
                        Envío calculado en checkout según peso ({selectedVariant.weight * quantity}g).
                    </p>
                </div>
            </div>
        </div>
    );
}