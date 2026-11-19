"use client";

import Link from "next/link";

import { asset } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { addToCart, toggleFavorite, useCart, useFavorites } from "@/lib/store";
import type { Product } from "@/lib/types";

import { Icon } from "./Icon";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const favorites = useFavorites();
  const inCart = cart[product.sku] ?? 0;
  const isFavorite = favorites.includes(product.sku);
  const href = `/product/${encodeURIComponent(product.sku)}`;

  return (
    <article className="card group hover:border-primary/30 relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgb(24_59_55/0.12)]">
      <Link href={href} className="bg-background relative block aspect-square overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              product.in_stock ? "" : "opacity-60 grayscale-[40%]"
            }`}
          />
        ) : (
          <span className="text-muted flex size-full flex-col items-center justify-center gap-2 text-xs">
            <img src={asset("/emblem.png")} alt="" className="size-12 opacity-50" />
            Фото скоро появится
          </span>
        )}
        <span className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {product.is_new && (
            <span className="bg-secondary text-text rounded-full px-2.5 py-0.5 text-xs font-bold">
              Новинка
            </span>
          )}
          {product.discount_percent > 0 && (
            <span className="bg-sale rounded-full px-2.5 py-0.5 text-xs font-bold text-white">
              −{product.discount_percent}%
            </span>
          )}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(product.sku)}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        className={`absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white ${
          isFavorite ? "text-sale" : "text-primary"
        }`}
      >
        <Icon name="heart" filled={isFavorite} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className={`text-lg font-extrabold ${product.discount_percent ? "text-sale" : ""}`}>
            {formatPrice(product.price)}
          </span>
          <span className="text-muted text-xs">/ {product.unit}</span>
          {product.old_price && product.discount_percent > 0 && (
            <s className="text-muted text-xs">{formatPrice(product.old_price)}</s>
          )}
        </p>
        <Link href={href} className="hover:text-primary line-clamp-2 text-sm leading-snug">
          {product.name}
        </Link>
        <p className="text-muted mb-2 text-xs">
          {product.category.name}
          {product.in_stock && product.stock <= 5 && (
            <span className="text-sale font-semibold"> · осталось {product.stock}</span>
          )}
        </p>

        {product.in_stock ? (
          <button
            type="button"
            onClick={() => addToCart(product.sku, 1, product.stock)}
            disabled={inCart >= product.stock}
            className={`mt-auto w-full ${inCart ? "btn-outline" : "btn-primary"}`}
          >
            {inCart ? (
              <>
                <Icon name="check" className="size-4" /> В корзине: {inCart}
              </>
            ) : (
              "В корзину"
            )}
          </button>
        ) : (
          <span className="bg-disabled text-text mt-auto rounded-lg px-5 py-2.5 text-center text-sm font-semibold">
            Нет в наличии
          </span>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.sku} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
