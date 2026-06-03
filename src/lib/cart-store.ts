// Simple session storage for promo/upsell selections between pages
export type UpsellChoice = { id: string; name: string; price: number };

const KEY = "sorteio_cart";

export type CartState = {
  promotion_id: string;
  ticket_price: number;
  upsells: UpsellChoice[];
  shipping: number;
};

export function saveCart(c: CartState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(c));
}
export function loadCart(): CartState | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(KEY);
  return v ? JSON.parse(v) : null;
}
export function clearCart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
