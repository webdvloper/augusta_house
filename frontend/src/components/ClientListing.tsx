"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { listingQuery, parseListing } from "@/lib/listing";
import type { Paginated, Product } from "@/lib/types";

import { ProductGridSkeleton } from "./ProductCard";
import { ListingView, type ListingProps } from "./ProductListing";
import { EmptyState } from "./Ui";

/**
 * Список товаров для статичной демо-версии: параметры адресной строки
 * читаются в браузере, фильтрация идёт по снимку каталога.
 */
export function ClientListing({ baseQuery, ...props }: ListingProps) {
  const params = useSearchParams();
  const state = parseListing((name) => params.get(name));
  const key = JSON.stringify([baseQuery, state]);
  const [result, setResult] = useState<{ key: string; data: Paginated<Product> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const [query, listing] = JSON.parse(key) as [typeof baseQuery, typeof state];
    api.products(listingQuery(query, listing)).then((data) => {
      if (!cancelled) setResult({ key, data });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (result?.key !== key) return <ProductGridSkeleton />;
  return <ListingView {...props} state={state} data={result.data} />;
}

/** Поиск в статичной версии: запрос q тоже читается в браузере. */
export function ClientSearch() {
  const q = useSearchParams().get("q")?.trim().slice(0, 100) ?? "";
  return (
    <>
      <h1 className="mb-5 text-4xl sm:text-5xl">{q ? `Поиск: «${q}»` : "Поиск"}</h1>
      {q ? (
        <ClientListing basePath="/search" baseQuery={{ search: q }} hidden={{ q }} />
      ) : (
        <EmptyState
          title="Что будем искать?"
          text="Введите название ткани, цвет или артикул в строке поиска."
        />
      )}
    </>
  );
}
