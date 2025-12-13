import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    variantId: string;
    productId: string;
    title: string;
    variantTitle: string;
    price: number;
    pricePro: number | null;
    image: string;
    quantity: number;
    weight: number;
    maxStock: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void;

    getTotalPrice: () => number;
    getTotalProPrice: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(i => i.variantId === newItem.variantId);

                if (existingItem) {
                    // CORRECCIÓN AQUÍ:
                    // Antes: existingItem.quantity + 1
                    // Ahora: existingItem.quantity + newItem.quantity
                    const newQty = Math.min(
                        existingItem.quantity + newItem.quantity,
                        existingItem.maxStock
                    );

                    set({
                        items: currentItems.map(i =>
                            i.variantId === newItem.variantId ? { ...i, quantity: newQty } : i
                        )
                    });
                } else {
                    // CORRECCIÓN AQUÍ TAMBIÉN:
                    // Antes: quantity: 1
                    // Ahora: quantity: newItem.quantity
                    set({
                        items: [...currentItems, { ...newItem, quantity: newItem.quantity }]
                    });
                }
            },

            removeItem: (variantId) => {
                set({ items: get().items.filter(i => i.variantId !== variantId) });
            },

            updateQuantity: (variantId, quantity) => {
                set({
                    items: get().items.map(i =>
                        i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i
                    )
                });
            },

            clearCart: () => set({ items: [] }),

            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            getTotalProPrice: () => {
                return get().items.reduce((total, item) => {
                    const p = item.pricePro !== null ? item.pricePro : item.price;
                    return total + (p * item.quantity);
                }, 0);
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'decklab-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);