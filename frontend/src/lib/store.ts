"use client";

import { useSyncExternalStore } from "react";

/**
 * Корзина и избранное хранятся в localStorage браузера:
 * регистрация покупателя в прототипе — заглушка, серверной сессии нет.
 */
export type Cart = Record<string, number>; // артикул → количество

const CART_KEY = "ah:cart";
const FAVORITES_KEY = "ah:favorites";
const EVENT = "ah:store";

const EMPTY_CART: Cart = {};
const EMPTY_FAVORITES: string[] = [];
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Хранилище недоступно (приватный режим) — состояние живёт до перезагрузки.
    cache.set(key, { raw: null, value });
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCart(): Cart {
  return useSyncExternalStore(
    subscribe,
    () => read<Cart>(CART_KEY, EMPTY_CART),
    () => EMPTY_CART,
  );
}

export function useFavorites(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => read<string[]>(FAVORITES_KEY, EMPTY_FAVORITES),
    () => EMPTY_FAVORITES,
  );
}

/** false на сервере и при гидратации, true после — чтобы не мигали счётчики. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const cartCount = (cart: Cart) => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

export function setQuantity(sku: string, quantity: number) {
  const cart = { ...read<Cart>(CART_KEY, EMPTY_CART) };
  if (quantity > 0) cart[sku] = Math.floor(quantity);
  else delete cart[sku];
  write(CART_KEY, cart);
}

export function addToCart(sku: string, quantity = 1, max = Infinity) {
  const current = read<Cart>(CART_KEY, EMPTY_CART)[sku] ?? 0;
  setQuantity(sku, Math.min(current + quantity, max));
}

export function clearCart() {
  write(CART_KEY, {});
}

export function toggleFavorite(sku: string) {
  const favorites = read<string[]>(FAVORITES_KEY, EMPTY_FAVORITES);
  write(
    FAVORITES_KEY,
    favorites.includes(sku) ? favorites.filter((item) => item !== sku) : [...favorites, sku],
  );
}
