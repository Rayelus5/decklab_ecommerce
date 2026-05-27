"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/hooks/use-cart";

/** Limpia el carrito al montar (se llama desde la página de confirmación de pedido) */
export function ClearCartOnSuccess() {
  const clearCart = useCart((s) => s.clearCart);
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
