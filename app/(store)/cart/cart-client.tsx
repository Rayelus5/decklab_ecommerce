"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Crown } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemRow } from "@/components/cart/cart-item";
import { Button } from "@/components/ui/button";

interface CartClientProps {
  isPro: boolean;
  proAllowanceBalance: number;
}

export function CartClient({ isPro, proAllowanceBalance }: CartClientProps) {
  const { items, clearCart, useProPricing, toggleProPricing } = useCart();
  const breakdown = useCart((s) => s.getProBreakdown(isPro, proAllowanceBalance));
  const subtotal = useCart((s) => s.getSubtotal(isPro, proAllowanceBalance));
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);

  const { itemStates, totalSavings, remainingAllowance } = breakdown;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-snow">Tu carrito</h1>
          {items.length > 0 && (
            <p className="text-sm text-slate-300 mt-1">
              {totalItems} artículo{totalItems !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-snow transition-colors"
        >
          <ArrowLeft size={15} />
          Seguir comprando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-graphite-700/60 border border-white/8 flex items-center justify-center">
            <ShoppingBag size={32} className="text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-snow">Tu carrito está vacío</h2>
            <p className="text-sm text-slate-300 mt-2">
              Añade productos desde la tienda para empezar.
            </p>
          </div>
          <Link href="/products">
            <Button size="lg">Ir a la tienda</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Panel PRO (solo si el usuario tiene PRO activo) */}
            {isPro && (
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-[14px] px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown size={14} className="text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">Precios PRO</span>
                  </div>
                  <button
                    onClick={toggleProPricing}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                      useProPricing ? "bg-amber-500" : "bg-white/15"
                    }`}
                    aria-label={useProPricing ? "Desactivar precios PRO" : "Activar precios PRO"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        useProPricing ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {useProPricing && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      Saldo disponible:{" "}
                      <span className="text-amber-300 font-medium tabular-nums">
                        {proAllowanceBalance.toFixed(2).replace(".", ",")} €
                      </span>
                    </span>
                    {totalSavings > 0.01 && (
                      <span className="text-amber-400 font-semibold">
                        Ahorras {totalSavings.toFixed(2).replace(".", ",")} €
                      </span>
                    )}
                  </div>
                )}

                {useProPricing && remainingAllowance < proAllowanceBalance && (
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div
                      className="bg-amber-400 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, (remainingAllowance / proAllowanceBalance) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5">
              <div className="divide-y divide-white/8">
                {items.map((item, idx) => (
                  <CartItemRow
                    key={item.variantId}
                    item={item}
                    proState={isPro ? itemStates[idx] : undefined}
                  />
                ))}
              </div>
              <div className="pt-4 mt-4 border-t border-white/8">
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-300 hover:text-ember-red transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="flex flex-col gap-4">
            <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-snow">Resumen</h2>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Subtotal</span>
                  <span className={`font-medium tabular-nums ${isPro && useProPricing && totalSavings > 0.01 ? "text-amber-400" : "text-snow"}`}>
                    {subtotal.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
                {isPro && useProPricing && totalSavings > 0.01 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300/60">Precio sin PRO</span>
                    <span className="text-slate-300/60 line-through tabular-nums">
                      {(subtotal + totalSavings).toFixed(2).replace(".", ",")} €
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-300">Envío</span>
                  <span className="text-slate-300">Calculado en checkout</span>
                </div>
              </div>

              <div className="border-t border-white/8 pt-3 flex justify-between">
                <span className="text-sm font-medium text-snow">Total estimado</span>
                <span className="text-base font-bold text-snow tabular-nums">
                  {subtotal.toFixed(2).replace(".", ",")} €
                </span>
              </div>

              <Link href="/checkout">
                <Button fullWidth size="lg">
                  Comprar ahora
                </Button>
              </Link>

              <p className="text-[10px] text-slate-300/50 text-center leading-relaxed">
                Sin devoluciones. El envío se calcula según peso y destino.
              </p>
            </div>

            {/* Cupón placeholder */}
            <div className="bg-graphite-700/30 border border-white/8 rounded-[11px] p-4">
              <p className="text-xs text-slate-300 mb-2 font-medium">¿Tienes un cupón?</p>
              <p className="text-xs text-slate-300/60">
                Aplica tu código de descuento en el checkout.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
