"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductImage, ProductVariant } from "@prisma/client";
import { ShieldCheck, ShoppingCart, Check, Minus, Plus, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

type ProductFull = Product & {
    images: ProductImage[];
    variants: ProductVariant[];
};

export default function ProductDetails({ product }: { product: ProductFull }) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
    const [quantity, setQuantity] = useState(1); // Estado local para la cantidad
    const { addItem } = useCartStore();

    const price = Number(selectedVariant.price);
    const pricePro = selectedVariant.pricePro ? Number(selectedVariant.pricePro) : null;
    const maxStock = selectedVariant.stock;
    const hasStock = maxStock > 0;

    // Resetear cantidad si cambia la variante
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
            quantity: quantity, // Usamos la cantidad seleccionada
            weight: selectedVariant.weight,
            maxStock: maxStock
        });

        // Feedback visual simple (alert temporal)
        alert(`Añadidas ${quantity} unidades al carrito`);
        // Opcional: Resetear a 1 tras añadir
        setQuantity(1);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* 1. Galería */}
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/5 bg-secondary/20">
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
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{product.title}</h1>

                {/* Precios */}
                <div className="flex items-end gap-4 mb-6 border-b border-white/10 pb-6">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Precio estándar</p>
                        <p className={cn("text-2xl font-bold", pricePro ? "text-muted-foreground line-through" : "text-white")}>
                            {price.toFixed(2)}€
                        </p>
                    </div>

                    {pricePro && (
                        <div>
                            <div className="flex items-center gap-1 text-pro mb-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase">Precio PRO</span>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {pricePro.toFixed(2)}€
                            </p>
                        </div>
                    )}
                </div>

                {/* Selector de Variantes */}
                {product.variants.length > 1 && (
                    <div className="mb-6">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">
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
                                            "px-4 py-2 rounded-lg border text-sm transition-all",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground font-bold"
                                                : "border-white/10 bg-card hover:bg-white/5 text-white"
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
                <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-white">Cantidad</span>
                        <span className={cn("text-xs font-bold", hasStock ? "text-green-400" : "text-red-400")}>
                            {hasStock ? `${maxStock} disponibles` : "Sin stock"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Selector Numérico */}
                        <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-1">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1 || !hasStock}
                                className="p-2 hover:bg-white/10 rounded-md text-white disabled:opacity-30 transition"
                            >
                                <Minus className="w-4 h-4" />
                            </button>

                            <div className="w-12 text-center font-bold text-white">
                                {quantity}
                            </div>

                            <button
                                onClick={() => handleQuantityChange(1)}
                                disabled={quantity >= maxStock || !hasStock}
                                className="p-2 hover:bg-white/10 rounded-md text-white disabled:opacity-30 transition"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Botón Añadir */}
                        <button
                            onClick={handleAddToCart}
                            disabled={!hasStock}
                            className={cn(
                                "flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5",
                                hasStock
                                    ? "bg-white text-black hover:bg-gray-200 active:scale-95"
                                    : "bg-white/5 text-white/30 cursor-not-allowed"
                            )}
                        >
                            {hasStock ? (
                                <>
                                    <ShoppingCart className="w-4 h-4" />
                                    Añadir {quantity * price}€
                                </>
                            ) : (
                                "Agotado"
                            )}
                        </button>
                    </div>

                    {/* Aviso si intenta añadir más del stock */}
                    {quantity === maxStock && hasStock && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-yellow-500">
                            <AlertCircle className="w-3 h-3" />
                            Has alcanzado el límite de stock disponible.
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        Envío calculado en checkout según peso ({selectedVariant.weight * quantity}g).
                    </p>
                </div>
            </div>
        </div>
    );
}