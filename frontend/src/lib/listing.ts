import type { ProductQuery } from "./api";

export const SORTS = [
  ["-created_at", "Сначала новые"],
  ["price", "Сначала дешёвые"],
  ["-price", "Сначала дорогие"],
  ["-views_count", "Популярные"],
] as const;

export const PAGE_SIZE = 12;

export interface ListingState {
  sort: string;
  page: number;
  in_stock: boolean;
  sale: boolean;
  min_price: string;
  max_price: string;
}

/** Разбирает параметры адресной строки; get возвращает значение по имени. */
export function parseListing(get: (name: string) => string | undefined | null): ListingState {
  const sort = get("sort");
  return {
    sort: SORTS.some(([value]) => value === sort) ? sort! : "-created_at",
    page: Math.max(1, Number(get("page")) || 1),
    in_stock: get("in_stock") === "1",
    sale: get("sale") === "1",
    min_price: get("min_price") ?? "",
    max_price: get("max_price") ?? "",
  };
}

export function listingQuery(base: ProductQuery, state: ListingState): ProductQuery {
  return {
    ...base,
    ordering: state.sort,
    page: state.page,
    in_stock: state.in_stock || undefined,
    sale: state.sale || undefined,
    min_price: state.min_price,
    max_price: state.max_price,
  };
}
