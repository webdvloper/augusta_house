"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

interface State {
  key: string;
  products: Product[];
  error: string | null;
}

/** Загружает актуальные цены и остатки по списку артикулов. */
export function useProducts(skus: string[], enabled = true) {
  const key = [...skus].sort().join(",");
  const [state, setState] = useState<State>({ key: "", products: [], error: null });

  useEffect(() => {
    if (!enabled || !key) return;
    let cancelled = false;
    api
      .products({ skus: key, page_size: 60 })
      .then((data) => !cancelled && setState({ key, products: data.results, error: null }))
      .catch((error: Error) => !cancelled && setState({ key, products: [], error: error.message }));
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  if (!key) return { products: [] as Product[], loading: false, error: null };
  // Пока список обновляется, показываем прежние товары, отфильтрованные по текущим артикулам.
  const products = state.products.filter((product) => skus.includes(product.sku));
  return { products, loading: state.key !== key && !products.length, error: state.error };
}
