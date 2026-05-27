"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Lock, Zap } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useCart } from "@/lib/hooks/use-cart";

interface ProductVariantPreview {
  id: string;
  price: number;
  pricePro?: number | null;
  stock: number;
  proExempt: boolean;
}

interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  variant?: ProductVariantPreview;
  isExclusive?: boolean;
  earlyAccessTierLevel?: number | null;
  noReturns?: boolean;
  isPro?: boolean;       // ¿El usuario es PRO?
  hasAccess?: boolean;   // ¿El usuario tiene acceso a este producto?
  categoryName?: string;
}

export function ProductCard({
  id,
  slug,
  title,
  imageUrl,
  imageAlt,
  variant,
  isExclusive = false,
  earlyAccessTierLevel,
  noReturns = true,
  isPro = false,
  hasAccess = true,
  categoryName,
}: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);

  const isOutOfStock = !variant || variant.stock === 0;
  const hasProPrice = isPro && variant?.pricePro && variant.pricePro > 0;
  const displayPrice = hasProPrice ? variant!.pricePro! : (variant?.price ?? 0);
  const originalPrice = variant?.price ?? 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!variant || isOutOfStock) {
      toast.error("Este producto está agotado");
      return;
    }
    if (!hasAccess) {
      toast.error("No tienes acceso a este producto");
      return;
    }

    addItem({
      variantId: variant.id,
      productId: id,
      productTitle: title,
      slug,
      imageUrl,
      price: variant.price,
      pricePro: variant.pricePro ?? undefined,
      weight: 0,
      stock: variant.stock,
      proExempt: variant.proExempt,
    });

    toast.success(`${title} añadido al carrito`);
  }

  return (
    <Link
      href={`/products/${slug}`}
      className={clsx(
        "group relative flex flex-col bg-graphite-700/40 border rounded-[16px] overflow-hidden",
        "transition-all duration-300",
        hasAccess
          ? "border-white/8 hover:border-white/15 hover:bg-graphite-700/60 hover:shadow-xl hover:-translate-y-0.5"
          : "border-white/5 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-square bg-graphite-600/60 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30" role="img" aria-hidden="true">🎴</span>
          </div>
        )}

        {/* Overlay de lock */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-void-black/70 flex flex-col items-center justify-center gap-2">
            <Lock size={24} className="text-slate-300" />
            <span className="text-xs text-slate-300 text-center px-4">
              {earlyAccessTierLevel
                ? `Requiere Nivel ${earlyAccessTierLevel}`
                : "Acceso exclusivo"}
            </span>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isExclusive && (
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full">
              EXCLUSIVO
            </span>
          )}
          {earlyAccessTierLevel && (
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-full flex items-center gap-1">
              <Zap size={9} />
              EARLY ACCESS
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-500/30 border border-white/10 text-slate-400 rounded-full">
              AGOTADO
            </span>
          )}
        </div>

        {/* Botón de añadir al carrito */}
        {hasAccess && !isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-9 h-9 bg-ash-50 text-graphite-700 rounded-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white shadow-lg"
            aria-label={`Añadir ${title} al carrito`}
          >
            <ShoppingCart size={16} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        {categoryName && (
          <span className="text-[10px] text-slate-300 uppercase tracking-widest">
            {categoryName}
          </span>
        )}

        <h3 className="text-sm font-medium text-snow line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Precios */}
        <div className="flex items-baseline gap-2 mt-0.5">
          {variant ? (
            <>
              <span
                className={clsx(
                  "text-sm font-semibold",
                  hasProPrice ? "text-amber-400" : "text-snow"
                )}
              >
                {displayPrice.toFixed(2).replace(".", ",")} €
              </span>
              {hasProPrice && (
                <span className="text-xs text-slate-300 line-through">
                  {originalPrice.toFixed(2).replace(".", ",")} €
                </span>
              )}
              {hasProPrice && (
                <span className="text-[10px] text-amber-400/80 font-medium">PRO</span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-300">Sin precio</span>
          )}
        </div>

        {/* No devoluciones */}
        {noReturns && (
          <p className="text-[9px] text-slate-300/50 mt-0.5">Sin devoluciones</p>
        )}
      </div>
    </Link>
  );
}
