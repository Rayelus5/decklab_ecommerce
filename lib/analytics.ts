/**
 * lib/analytics.ts — Helper de Google Analytics 4
 * Solo se ejecuta en el cliente (componentes con "use client").
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

// ─── Eventos de e-commerce ────────────────────────────────────────────────────

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}) {
  gtag("event", "add_to_cart", {
    currency: "EUR",
    value: item.price * (item.quantity ?? 1),
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity ?? 1 }],
  });
}

export function trackBeginCheckout(value: number, itemCount: number) {
  gtag("event", "begin_checkout", { currency: "EUR", value, num_items: itemCount });
}

export function trackPurchase(order: {
  orderNumber: number;
  total: number;
  shippingCost: number;
  items: { id: string; name: string; price: number; quantity: number }[];
}) {
  gtag("event", "purchase", {
    currency: "EUR",
    transaction_id: String(order.orderNumber),
    value: order.total,
    shipping: order.shippingCost,
    items: order.items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

export function trackSignUp(method: "credentials" | "google" | "telegram") {
  gtag("event", "sign_up", { method });
}

export function trackLogin(method: "credentials" | "google" | "telegram") {
  gtag("event", "login", { method });
}

export function trackProSubscription(tierName: string, value: number) {
  gtag("event", "purchase", {
    currency: "EUR",
    value,
    item_category: "subscription",
    item_name: `PRO ${tierName}`,
  });
}
