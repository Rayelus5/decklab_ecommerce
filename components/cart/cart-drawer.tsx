"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemRow } from "./cart-item";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  isPro?: boolean;
  proAllowanceBalance?: number;
}

export function CartDrawer({ isPro = false, proAllowanceBalance = 0 }: CartDrawerProps) {
  const { items, isOpen, closeCart, clearCart } = useCart();

  const subtotal = useCart((s) => s.getSubtotal(isPro, proAllowanceBalance));
  const regularSubtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const saving = regularSubtotal - subtotal;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Carrito de compra"
        aria-modal="true"
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-graphite-700 border-l border-white/8 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-slate-300" />
            <h2 className="text-base font-semibold text-snow">
              Carrito
            </h2>
            {items.length > 0 && (
              <span className="text-xs text-slate-300">
                ({items.reduce((a, i) => a + i.quantity, 0)} artículo{items.reduce((a, i) => a + i.quantity, 0) !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-300 hover:text-ember-red transition-colors"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 text-slate-300 hover:text-snow hover:bg-white/5 rounded-[6px] transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag size={40} className="text-white/15" />
              <div>
                <p className="text-base font-medium text-snow">Tu carrito está vacío</p>
                <p className="text-sm text-slate-300 mt-1">
                  Explora la tienda y añade productos.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCart}
                className="mt-2"
              >
                Ver tienda
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  isPro={isPro}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer con totales y CTA */}
        {items.length > 0 && (
          <div className="border-t border-white/8 px-5 py-4 flex flex-col gap-4">
            {/* Ahorro PRO */}
            {isPro && saving > 0.01 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400">Ahorro PRO</span>
                <span className="text-amber-400 font-semibold">
                  -{saving.toFixed(2).replace(".", ",")} €
                </span>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Subtotal (sin envío)</span>
              <span className="text-base font-semibold text-snow tabular-nums">
                {subtotal.toFixed(2).replace(".", ",")} €
              </span>
            </div>

            {/* Aviso no devoluciones */}
            <p className="text-[10px] text-slate-300/60 text-center">
              Sin devoluciones en ningún producto. El precio final incluye el envío elegido en el checkout.
            </p>

            {/* CTA */}
            <Link href="/checkout" onClick={closeCart}>
              <Button fullWidth size="lg">
                Ir al checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
