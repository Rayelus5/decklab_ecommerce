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

export interface CartItemProState {
  variantId: string;
  usesProPrice: boolean;  // ¿Este ítem pagará al precio PRO?
  canUsePro: boolean;     // ¿Tiene precio PRO definido?
  isExempt: boolean;      // ¿Es proExempt (PRO sin consumir allowance)?
  insufficientBalance: boolean; // ¿Tiene precio PRO pero no hay saldo?
  allowanceUsed: number;  // Cuánto allowance consume este ítem
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  useProPricing: boolean; // Toggle global: el usuario elige si usar su saldo PRO

  // --- Acciones ---
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  toggleProPricing: () => void;

  // --- Computed ---
  getTotalItems: () => number;
  getTotalWeight: () => number;
  getSubtotal: (isPro?: boolean, proAllowanceBalance?: number) => number;
  getProBreakdown: (isPro: boolean, proAllowanceBalance: number) => {
    itemStates: CartItemProState[];
    totalAllowanceUsed: number;
    remainingAllowance: number;
    totalSavings: number;
  };
}

// -------------------------------------------------------
// Store
// -------------------------------------------------------
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      useProPricing: true,

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
      toggleProPricing: () => set((state) => ({ useProPricing: !state.useProPricing })),

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
        const { items, useProPricing, getProBreakdown } = get();
        if (!isPro || !useProPricing) {
          return Math.round(
            items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
          ) / 100;
        }
        const { itemStates } = getProBreakdown(isPro, proAllowanceBalance);
        let total = 0;
        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const state = itemStates[idx];
          const unitPrice = state.usesProPrice ? (item.pricePro ?? item.price) : item.price;
          total += unitPrice * item.quantity;
        }
        return Math.round(total * 100) / 100;
      },

      getProBreakdown: (isPro: boolean, proAllowanceBalance: number) => {
        const { items, useProPricing } = get();

        if (!isPro || !useProPricing) {
          return {
            itemStates: items.map((item) => ({
              variantId: item.variantId,
              usesProPrice: false,
              canUsePro: !!(item.pricePro && item.pricePro > 0),
              isExempt: item.proExempt,
              insufficientBalance: false,
              allowanceUsed: 0,
            })),
            totalAllowanceUsed: 0,
            remainingAllowance: proAllowanceBalance,
            totalSavings: 0,
          };
        }

        let remaining = proAllowanceBalance;
        let totalAllowanceUsed = 0;
        let totalSavings = 0;

        const itemStates: CartItemProState[] = items.map((item) => {
          const canUsePro = !!(item.pricePro && item.pricePro > 0 && item.pricePro < item.price);

          if (!canUsePro) {
            return {
              variantId: item.variantId,
              usesProPrice: false,
              canUsePro: false,
              isExempt: false,
              insufficientBalance: false,
              allowanceUsed: 0,
            };
          }

          const itemProTotal = item.pricePro! * item.quantity;
          const savings = (item.price - item.pricePro!) * item.quantity;

          if (item.proExempt) {
            // Precio PRO sin consumir allowance
            totalSavings += savings;
            return {
              variantId: item.variantId,
              usesProPrice: true,
              canUsePro: true,
              isExempt: true,
              insufficientBalance: false,
              allowanceUsed: 0,
            };
          }

          if (remaining >= itemProTotal) {
            remaining -= itemProTotal;
            totalAllowanceUsed += itemProTotal;
            totalSavings += savings;
            return {
              variantId: item.variantId,
              usesProPrice: true,
              canUsePro: true,
              isExempt: false,
              insufficientBalance: false,
              allowanceUsed: itemProTotal,
            };
          }

          // Allowance insuficiente para este ítem → precio normal
          return {
            variantId: item.variantId,
            usesProPrice: false,
            canUsePro: true,
            isExempt: false,
            insufficientBalance: true,
            allowanceUsed: 0,
          };
        });

        return {
          itemStates,
          totalAllowanceUsed,
          remainingAllowance: remaining,
          totalSavings,
        };
      },
    }),
    {
      name: "decklab-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        useProPricing: state.useProPricing,
      }),
    }
  )
);
