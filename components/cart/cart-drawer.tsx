"use client";

import Link from "next/link";
import { X, ShoppingBag, Crown, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemRow } from "./cart-item";
import { Button } from "@/components/ui/button";
import { CartErrorBoundary } from "@/components/error-boundary";

interface CartDrawerProps {
  isPro?: boolean;
  proAllowanceBalance?: number;
}

export function CartDrawer({ isPro = false, proAllowanceBalance = 0 }: CartDrawerProps) {
  const { items, isOpen, closeCart, clearCart, useProPricing, toggleProPricing } = useCart();

  const breakdown = useCart((s) => s.getProBreakdown(isPro, proAllowanceBalance));
  const { itemStates, totalAllowanceUsed, remainingAllowance, totalSavings } = breakdown;

  const subtotal = useCart((s) => s.getSubtotal(isPro, proAllowanceBalance));
  const totalItems = items.reduce((a, i) => a + i.quantity, 0);

  return (
    <CartErrorBoundary>
    <AnimatePresence>
    {isOpen && (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        role="dialog"
        aria-label="Carrito de compra"
        aria-modal="true"
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-graphite-700 border-l border-white/8 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-slate-300" />
            <h2 className="text-base font-semibold text-snow">Carrito</h2>
            {items.length > 0 && (
              <span className="text-xs text-slate-300">
                ({totalItems} artículo{totalItems !== 1 ? "s" : ""})
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

        {/* PRO allowance panel — solo si es PRO y hay ítems */}
        {isPro && items.length > 0 && (
          <div className="px-5 py-3 bg-amber-500/6 border-b border-amber-500/15">
            {/* Toggle + saldo */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Wallet size={13} className="text-amber-400" />
                <span className="text-xs font-medium text-amber-300">Saldo PRO</span>
              </div>
              {/* Toggle usar saldo PRO */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-slate-300">
                  {useProPricing ? "Activo" : "Inactivo"}
                </span>
                <button
                  type="button"
                  onClick={toggleProPricing}
                  aria-label="Activar/desactivar precio PRO"
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    useProPricing ? "bg-amber-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      useProPricing ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Barra de progreso de saldo */}
            <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
              <span>Disponible: {proAllowanceBalance.toFixed(2)} €</span>
              {useProPricing && totalAllowanceUsed > 0 && (
                <span className="text-amber-400">
                  Consumido: {totalAllowanceUsed.toFixed(2)} €
                </span>
              )}
            </div>
            {useProPricing && proAllowanceBalance > 0 && (
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totalAllowanceUsed / proAllowanceBalance) * 100)}%`,
                  }}
                />
              </div>
            )}
            {useProPricing && totalAllowanceUsed > 0 && (
              <p className="text-[10px] text-slate-300/70 mt-1.5">
                Quedarán {remainingAllowance.toFixed(2)} € tras esta compra
              </p>
            )}
            {!useProPricing && (
              <p className="text-[10px] text-slate-300/60">
                Activa el saldo PRO para pagar productos elegibles a precio reducido.
              </p>
            )}
          </div>
        )}

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
              <Button variant="outline" size="sm" onClick={closeCart} className="mt-2">
                Ver tienda
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {items.map((item, idx) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  proState={itemStates[idx]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/8 px-5 py-4 flex flex-col gap-3">
            {/* Ahorro PRO */}
            {isPro && useProPricing && totalSavings > 0.01 && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-400">
                  <Crown size={11} />
                  Ahorro con PRO
                </span>
                <span className="text-amber-400 font-semibold tabular-nums">
                  -{totalSavings.toFixed(2).replace(".", ",")} €
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

            <p className="text-[10px] text-slate-300/60 text-center">
              Sin devoluciones en ningún producto. El precio final incluye el envío elegido en el checkout.
            </p>

            <Link href="/checkout" onClick={closeCart}>
              <Button fullWidth size="lg">
                Ir al checkout
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </>
    )}
    </AnimatePresence>
    </CartErrorBoundary>
  );
}
