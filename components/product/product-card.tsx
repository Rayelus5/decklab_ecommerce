"use client";

import Link from "next/link";
// import Image from "next/image";
import { ShoppingCart, Lock, Zap, ImageOff, Crown } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useCart } from "@/lib/hooks/use-cart";

interface ProductVariantPreview {
  id: string;
  title?: string;
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
  isPro?: boolean;
  hasAccess?: boolean;
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
  const hasPriceProDefined = !!(variant?.pricePro && variant.pricePro > 0);
  const isPayingProPrice = isPro && hasPriceProDefined;
  const displayPrice = isPayingProPrice ? variant!.pricePro! : (variant?.price ?? 0);
  const originalPrice = variant?.price ?? 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || isOutOfStock) { toast.error("Este producto está agotado"); return; }
    if (!hasAccess) { toast.error("No tienes acceso a este producto"); return; }
    addItem({
      variantId: variant.id,
      productId: id,
      productTitle: title,
      variantTitle: variant.title,
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
        "group relative flex flex-col rounded-[20px] overflow-hidden",
        "transition-all duration-300 ease-out",
        hasAccess
          ? [
            "bg-graphite-700/50 border border-white/8",
            "hover:border-white/18 hover:-translate-y-1",
            "hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]",
          ]
          : "bg-graphite-700/30 border border-white/4 opacity-55 cursor-not-allowed"
      )}
    >
      {/* ── Imagen ─────────────────────────────────────────── */}
      <div className="relative aspect-[1/1] bg-graphite-600/60 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt ?? title}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.07] w-full h-full"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff size={32} className="text-white/12" />
          </div>
        )}

        {/* Gradient fade al fondo — fusiona imagen con la info */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-graphite-700 via-graphite-700/60 to-transparent pointer-events-none" />

        {/* Lock overlay */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-void-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-graphite-600/80 border border-white/10 flex items-center justify-center">
              <Lock size={18} className="text-slate-300" />
            </div>
            <span className="text-xs text-slate-300 text-center px-4 leading-snug">
              {earlyAccessTierLevel ? `Requiere Nivel ${earlyAccessTierLevel}` : "Acceso exclusivo"}
            </span>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isExclusive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-full backdrop-blur-sm">
              <Crown size={9} />
              EXCLUSIVO
            </span>
          )}
          {earlyAccessTierLevel && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-sky-500/20 border border-sky-500/35 text-sky-300 rounded-full backdrop-blur-sm">
              <Zap size={9} />
              EARLY ACCESS
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-graphite-500/80 border border-white/10 text-slate-400 rounded-full backdrop-blur-sm">
              AGOTADO
            </span>
          )}
        </div>

        {/* Botón añadir al carrito — aparece en hover sobre imagen */}
        {hasAccess && !isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className={clsx(
              "absolute bottom-3 right-3 z-10",
              "flex items-center gap-2 px-3 py-2",
              "bg-snow text-graphite-700 rounded-[10px]",
              "text-xs font-bold",
              "shadow-lg",
              "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
              "transition-all duration-200 ease-out",
              "hover:bg-ash-50 active:scale-95 cursor-pointer"
            )}
            aria-label={`Añadir ${title} al carrito`}
          >
            <ShoppingCart size={13} />
            Añadir
          </button>
        )}
      </div>

      {/* ── Info ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4 justify-between h-full max-h-[160px]">

        {/* Categoría */}
        {categoryName && (
          <span className="text-[10px] font-semibold text-slate-300/70 uppercase tracking-[0.12em]">
            {categoryName}
          </span>
        )}

        {/* Título */}
        <h3 className="text-sm font-semibold text-snow line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* ── Bloque de precios ── */}
        {variant ? (
          <div className="mt-1 flex flex-col justify-between gap-2">

            {/* Precio principal — tamaño y peso dominantes */}
            <div className="flex items-end gap-2.5">
              <span
                className={clsx(
                  "text-[1.6rem] leading-none font-black tabular-nums tracking-tight",
                  isPayingProPrice ? "text-amber-400" : "text-snow"
                )}
              >
                {displayPrice.toFixed(2).replace(".", ",")}
                <span className="text-lg ml-0.5">&euro;</span>
              </span>

              {/* Precio original tachado — solo cuando el usuario PRO ve el PRO price */}
              {isPayingProPrice && (
                <span className="text-sm text-slate-300/50 line-through tabular-nums mb-0.5">
                  {originalPrice.toFixed(2).replace(".", ",")} &euro;
                </span>
              )}
            </div>

            {/* Pill PRO palpitante — visible para TODOS cuando hay precio PRO */}
            {hasPriceProDefined && (
              <span
                className={clsx(
                  "animate-pro-pulse",
                  "inline-flex items-center gap-1.5 self-start",
                  "pl-2 pr-3 py-1 rounded-full",
                  "bg-red-950/70 border border-red-500/50",
                  "text-[11px] font-bold text-red-400 tracking-wide",
                  "whitespace-nowrap select-none"
                )}
              >
                <Crown size={10} className="shrink-0 text-red-500" />
                PRECIO PRO&nbsp;
                <span className="text-red-300 font-black tabular-nums">
                  {variant.pricePro!.toFixed(2).replace(".", ",")} &euro;
                </span>
              </span>
            )}

          </div>
        ) : (
          <p className="text-sm text-slate-300/60 mt-1">Sin precio</p>
        )}

        {/* Sin devoluciones */}
        {/* {noReturns && (
          <p className="text-[9px] text-slate-300/35 mt-0.5 tracking-wide">
            SIN DEVOLUCIONES
          </p>
        )} */}
      </div>
    </Link>
  );
}
