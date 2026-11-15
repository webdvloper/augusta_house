import Link from "next/link";

import { api, type ProductQuery } from "@/lib/api";
import { route } from "@/lib/config";
import { productsWord } from "@/lib/format";
import { listingQuery, PAGE_SIZE, parseListing, SORTS, type ListingState } from "@/lib/listing";
import type { Paginated, Product } from "@/lib/types";

import { ProductGrid } from "./ProductCard";
import { EmptyState } from "./Ui";

export type SearchParams = Record<string, string | string[] | undefined>;

export interface ListingProps {
  basePath: string;
  baseQuery: ProductQuery;
  /** Параметры, которые нужно сохранять при фильтрации (например, q в поиске). */
  hidden?: Record<string, string>;
}

/** Фильтры, сетка и пагинация. Фильтры — обычная GET-форма, работает без JS. */
export function ListingView({
  basePath,
  hidden = {},
  state,
  data,
}: Omit<ListingProps, "baseQuery"> & { state: ListingState; data: Paginated<Product> }) {
  const pages = Math.ceil(data.count / PAGE_SIZE);

  const pageHref = (target: number) => {
    const params = new URLSearchParams(hidden);
    if (state.sort !== "-created_at") params.set("sort", state.sort);
    if (state.in_stock) params.set("in_stock", "1");
    if (state.sale) params.set("sale", "1");
    if (state.min_price) params.set("min_price", state.min_price);
    if (state.max_price) params.set("max_price", state.max_price);
    if (target > 1) params.set("page", String(target));
    return params.size ? `${basePath}?${params}` : basePath;
  };

  return (
    <div className="space-y-5">
      <form
        // key: при переходе по ссылкам поля формы должны отражать новые параметры
        key={JSON.stringify(state)}
        action={route(basePath)}
        className="card flex flex-wrap items-end gap-x-5 gap-y-3 p-4 text-sm"
        aria-label="Фильтры"
      >
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">Сортировка</span>
          <select name="sort" defaultValue={state.sort} className="input w-48">
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-muted text-xs">Цена, ₽</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="min_price"
              min={0}
              placeholder="от"
              aria-label="Цена от"
              defaultValue={state.min_price}
              className="input w-24"
            />
            <input
              type="number"
              name="max_price"
              min={0}
              placeholder="до"
              aria-label="Цена до"
              defaultValue={state.max_price}
              className="input w-24"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 py-2.5">
          <input
            type="checkbox"
            name="in_stock"
            value="1"
            defaultChecked={state.in_stock}
            className="accent-primary size-4"
          />
          В наличии
        </label>
        <label className="flex items-center gap-2 py-2.5">
          <input
            type="checkbox"
            name="sale"
            value="1"
            defaultChecked={state.sale}
            className="accent-primary size-4"
          />
          Со скидкой
        </label>
        <button type="submit" className="btn-primary">
          Показать
        </button>
        <Link
          href={
            Object.keys(hidden).length ? `${basePath}?${new URLSearchParams(hidden)}` : basePath
          }
          className="text-muted hover:text-primary py-2.5"
        >
          Сбросить
        </Link>
        <p className="text-muted ml-auto py-2.5">{productsWord(data.count)}</p>
      </form>

      {data.results.length ? (
        <ProductGrid products={data.results} />
      ) : (
        <EmptyState
          title="Ничего не нашлось"
          text="Попробуйте изменить фильтры или загляните в другие рубрики."
          action={
            <Link href="/catalog" className="btn-primary">
              Весь каталог
            </Link>
          }
        />
      )}

      {pages > 1 && (
        <nav aria-label="Страницы" className="flex flex-wrap justify-center gap-2 pt-2">
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <Link
              key={number}
              href={pageHref(number)}
              aria-current={number === state.page ? "page" : undefined}
              className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold ${
                number === state.page
                  ? "bg-primary text-white"
                  : "border-border bg-surface hover:border-primary border"
              }`}
            >
              {number}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Серверный список: параметры читаются из запроса, товары — из Django API. */
export async function ProductListing({
  searchParams,
  baseQuery,
  ...props
}: ListingProps & { searchParams: SearchParams }) {
  const state = parseListing((name) => first(searchParams[name]));
  const data = await api.products(listingQuery(baseQuery, state));
  return <ListingView {...props} state={state} data={data} />;
}
