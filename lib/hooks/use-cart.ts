"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface CartItem {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle?: string;
  imageUrl?: string;
  slug: string;
  price: number;       // Precio público
  pricePro?: number;   // Precio PRO (si existe)
  weight: number;      // Gramos
  quantity: number;
  stock: number;       // Stock máximo disponible
  proExempt: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // --- Acciones ---
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // --- Computed (como getters via métodos) ---
  getTotalItems: () => number;
  getTotalWeight: () => number;
  getSubtotal: (isPro?: boolean, proAllowanceBalance?: number) => number;
}

// -------------------------------------------------------
// Store
// -------------------------------------------------------
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === newItem.variantId
          );

          if (existing) {
            const newQty = Math.min(
              existing.quantity + (newItem.quantity ?? 1),
              existing.stock
            );
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
              isOpen: true,
            };
          }

          return {
            items: [
              ...state.items,
              { ...newItem, quantity: newItem.quantity ?? 1 },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.variantId !== variantId) };
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, i.stock) }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalWeight: () => {
        return get().items.reduce(
          (total, item) => total + item.weight * item.quantity,
          0
        );
      },

      getSubtotal: (isPro = false, proAllowanceBalance = 0) => {
        const items = get().items;
        let remaining = proAllowanceBalance;
        let total = 0;

        for (const item of items) {
          const hasProPrice = isPro && item.pricePro && item.pricePro > 0;

          if (!hasProPrice) {
            total += item.price * item.quantity;
            continue;
          }

          const itemProTotal = item.pricePro! * item.quantity;
          const itemRegularTotal = item.price * item.quantity;

          if (item.proExempt) {
            // PRO price sin gastar allowance
            total += itemProTotal;
          } else if (remaining >= itemProTotal) {
            // Allowance suficiente
            total += itemProTotal;
            remaining -= itemProTotal;
          } else {
            // Sin allowance suficiente → precio normal
            total += itemRegularTotal;
          }
        }

        return Math.round(total * 100) / 100;
      },
    }),
    {
      name: "decklab-cart",
      storage: createJSONStorage(() => localStorage),
      // Solo persistir los items, no el estado del drawer
      partialize: (state) => ({ items: state.items }),
    }
  )
);
