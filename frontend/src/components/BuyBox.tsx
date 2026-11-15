"use client";

import Link from "next/link";
import { useState } from "react";

import { addToCart, toggleFavorite, useCart, useFavorites } from "@/lib/store";
import type { Product } from "@/lib/types";

import { Icon } from "./Icon";

export function QuantityInput({
  value,
  max,
  unit,
  onChange,
}: {
  value: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const clamp = (next: number) => Math.max(1, Math.min(max, Math.floor(next) || 1));
  return (
    <div className="border-border bg-surface inline-flex items-center rounded-lg border">
      <button
        type="button"
        aria-label="Меньше"
        disabled={value <= 1}
        onClick={() => onChange(clamp(value - 1))}
        className="text-primary disabled:text-disabled size-10 text-xl"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        aria-label={`Количество, ${unit}`}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="w-12 [appearance:textfield] bg-transparent text-center text-sm font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Больше"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="text-primary disabled:text-disabled size-10 text-xl"
      >
        +
      </button>
    </div>
  );
}

export function BuyBox({ product }: { product: Product }) {
  const cart = useCart();
  const favorites = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const inCart = cart[product.sku] ?? 0;
  const available = product.stock - inCart;
  const isFavorite = favorites.includes(product.sku);

  return (
    <div className="space-y-3">
      {product.in_stock ? (
        <div className="flex flex-wrap items-center gap-3">
          {available > 0 && (
            <QuantityInput
              value={Math.min(quantity, available)}
              max={available}
              unit={product.unit}
              onChange={setQuantity}
            />
          )}
          <button
            type="button"
            disabled={available <= 0}
            onClick={() => {
              addToCart(product.sku, Math.min(quantity, available), product.stock);
              setQuantity(1);
            }}
            className="btn-primary min-w-44 flex-1 py-3 sm:flex-none"
          >
            <Icon name="cart" /> {available > 0 ? "В корзину" : "Весь остаток в корзине"}
          </button>
        </div>
      ) : (
        <p className="bg-disabled text-text inline-block rounded-lg px-5 py-3 text-sm font-semibold">
          Нет в наличии
        </p>
      )}

      {inCart > 0 && (
        <p className="text-sm">
          В корзине: {inCart} {product.unit}.{" "}
          <Link href="/cart" className="text-primary font-bold hover:underline">
            Перейти к оформлению
          </Link>
        </p>
      )}

      <button
        type="button"
        onClick={() => toggleFavorite(product.sku)}
        aria-pressed={isFavorite}
        className={`flex items-center gap-2 text-sm font-semibold ${
          isFavorite ? "text-sale" : "text-primary"
        }`}
      >
        <Icon name="heart" filled={isFavorite} />
        {isFavorite ? "В избранном" : "Добавить в избранное"}
      </button>
    </div>
  );
}
