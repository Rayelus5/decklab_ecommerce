"use client";

import { useState } from "react";
import { ShoppingCart, Lock } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { useCart } from "@/lib/hooks/use-cart";
import { Button } from "@/components/ui/button";

interface Variant {
  id: string;
  sku: string;
  title: string | null;
  price: number;
  pricePro: number | null;
  proExempt: boolean;
  stock: number;
  weight: number;
  attributes: unknown;
}

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    variants: Variant[];
  };
  isPro: boolean;
  accessDenied: boolean;
}

export function ProductActions({ product, isPro, accessDenied }: ProductActionsProps) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id ?? ""
  );

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const hasProPrice = isPro && selectedVariant?.pricePro && selectedVariant.pricePro > 0;
  const displayPrice = hasProPrice
    ? selectedVariant!.pricePro!
    : selectedVariant?.price ?? 0;
  const originalPrice = selectedVariant?.price ?? 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  function handleAddToCart() {
    if (!selectedVariant || isOutOfStock) {
      toast.error("Este producto está agotado");
      return;
    }

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productTitle: product.title,
      variantTitle: selectedVariant.title ?? undefined,
      imageUrl: product.imageUrl,
      slug: product.slug,
      price: selectedVariant.price,
      pricePro: selectedVariant.pricePro ?? undefined,
      weight: selectedVariant.weight,
      stock: selectedVariant.stock,
      proExempt: selectedVariant.proExempt,
    });

    toast.success(`${product.title} añadido al carrito`);
    openCart();
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          fullWidth
          disabled
          size="lg"
          className="cursor-not-allowed"
        >
          <Lock size={16} />
          Sin acceso a este producto
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de variante */}
      {product.variants.length > 1 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200">Variante</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                disabled={variant.stock === 0}
                className={clsx(
                  "px-3 py-2 text-sm rounded-[8px] border transition-colors",
                  variant.stock === 0 && "opacity-40 cursor-not-allowed line-through",
                  selectedVariantId === variant.id
                    ? "bg-ash-50 text-graphite-700 border-transparent"
                    : "bg-white/5 text-snow border-white/10 hover:border-white/20"
                )}
              >
                {variant.title ?? variant.sku}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Precio */}
      <div className="flex items-baseline gap-3">
        <span
          className={clsx(
            "text-3xl font-bold",
            hasProPrice ? "text-amber-400" : "text-snow"
          )}
        >
          {displayPrice.toFixed(2).replace(".", ",")} €
        </span>
        {hasProPrice && (
          <>
            <span className="text-lg text-slate-300 line-through">
              {originalPrice.toFixed(2).replace(".", ",")} €
            </span>
            <span className="text-sm text-amber-400 font-medium">Precio PRO</span>
          </>
        )}
      </div>

      {/* Stock */}
      {selectedVariant && (
        <p
          className={clsx(
            "text-xs",
            isOutOfStock
              ? "text-ember-red"
              : selectedVariant.stock < 5
              ? "text-amber-400"
              : "text-mint-signal"
          )}
        >
          {isOutOfStock
            ? "Agotado"
            : selectedVariant.stock < 5
            ? `Quedan ${selectedVariant.stock} unidades`
            : "En stock"}
        </p>
      )}

      {/* Botón de compra */}
      <Button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        fullWidth
        size="lg"
      >
        <ShoppingCart size={16} />
        {isOutOfStock ? "Agotado" : "Añadir al carrito"}
      </Button>

      {/* proExempt info */}
      {selectedVariant?.proExempt && isPro && (
        <p className="text-xs text-amber-400/80 text-center">
          ✓ Precio PRO sin consumir allowance mensual
        </p>
      )}
    </div>
  );
}
