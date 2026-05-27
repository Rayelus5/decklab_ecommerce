"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ImageOff, Crown, AlertCircle } from "lucide-react";
import { useCart, type CartItem, type CartItemProState } from "@/lib/hooks/use-cart";

interface CartItemProps {
  item: CartItem;
  proState?: CartItemProState;
}

export function CartItemRow({ item, proState }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const usesProPrice = proState?.usesProPrice ?? false;
  const insufficientBalance = proState?.insufficientBalance ?? false;
  const isExempt = proState?.isExempt ?? false;

  const unitPrice = usesProPrice ? (item.pricePro ?? item.price) : item.price;
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      {/* Imagen */}
      <Link
        href={`/products/${item.slug}`}
        className="shrink-0 w-16 h-16 bg-graphite-600/50 border border-white/8 rounded-[8px] overflow-hidden relative"
        aria-label={`Ver ${item.productTitle}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productTitle}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff size={18} className="text-white/15" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.slug}`}
            className="text-sm font-medium text-snow hover:text-ash-50 transition-colors line-clamp-2 leading-snug"
          >
            {item.productTitle}
            {item.variantTitle && (
              <span className="text-slate-300 font-normal"> — {item.variantTitle}</span>
            )}
          </Link>
          <button
            onClick={() => removeItem(item.variantId)}
            className="shrink-0 p-1 text-slate-300 hover:text-ember-red transition-colors rounded-[4px]"
            aria-label={`Eliminar ${item.productTitle}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Precio + cantidad */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-graphite-600/60 border border-white/8 rounded-[6px]">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-snow transition-colors"
              aria-label="Reducir cantidad"
            >
              <Minus size={13} />
            </button>
            <span className="w-6 text-center text-sm text-snow tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-snow transition-colors disabled:opacity-40"
              aria-label="Aumentar cantidad"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className={`text-sm font-semibold tabular-nums ${usesProPrice ? "text-amber-400" : "text-snow"}`}>
              {lineTotal.toFixed(2).replace(".", ",")} €
            </span>
            {usesProPrice && (
              <span className="text-[10px] text-slate-300 line-through tabular-nums">
                {(item.price * item.quantity).toFixed(2).replace(".", ",")} €
              </span>
            )}
          </div>
        </div>

        {/* Estado PRO del ítem */}
        <div className="flex items-center gap-1.5 min-h-[16px]">
          {usesProPrice && isExempt && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/80">
              <Crown size={12} />
              Precio PRO (sin consumir saldo)
            </span>
          )}
          {usesProPrice && !isExempt && (
            <span className="flex items-center gap-1 text-sm text-amber-400/80">
              <Crown size={12} />
              Precio PRO: <span className="text-green-300">-{((item.price - (item.pricePro ?? item.price)) * item.quantity).toFixed(2)} €</span>
            </span>
          )}
          {insufficientBalance && (
            <span className="flex items-center gap-1 text-[10px] text-slate-300/60">
              <AlertCircle size={12} />
              Saldo insuficiente — precio público
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
