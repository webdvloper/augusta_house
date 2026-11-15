"use client";

import Link from "next/link";

import { useFavorites, useHydrated } from "@/lib/store";

import { ProductGrid, ProductGridSkeleton } from "./ProductCard";
import { EmptyState } from "./Ui";
import { useProducts } from "./useProducts";

export function FavoritesView() {
  const hydrated = useHydrated();
  const favorites = useFavorites();
  const { products, loading, error } = useProducts(favorites, hydrated);

  if (!hydrated || loading) return <ProductGridSkeleton count={4} />;
  if (error) return <EmptyState title="Не удалось загрузить избранное" text={error} />;
  if (!products.length) {
    return (
      <EmptyState
        title="В избранном пока пусто"
        text="Нажмите на сердечко на карточке товара, чтобы сохранить его здесь."
        action={
          <Link href="/catalog" className="btn-primary">
            Перейти в каталог
          </Link>
        }
      />
    );
  }
  return <ProductGrid products={products} />;
}
