import Link from "next/link";

import { api, type ProductQuery } from "@/lib/api";
import { productsWord } from "@/lib/format";

import { ProductGrid } from "./ProductCard";
import { EmptyState } from "./Ui";

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS = [
  ["-created_at", "Сначала новые"],
  ["price", "Сначала дешёвые"],
  ["-price", "Сначала дорогие"],
  ["-views_count", "Популярные"],
] as const;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Список товаров с фильтрами. Фильтры — обычная GET-форма, работает без JS. */
export async function ProductListing({
  basePath,
  baseQuery,
  searchParams,
  hidden = {},
}: {
  basePath: string;
  baseQuery: ProductQuery;
  searchParams: SearchParams;
  hidden?: Record<string, string>;
}) {
  const sort = SORTS.some(([value]) => value === first(searchParams.sort))
    ? first(searchParams.sort)!
    : "-created_at";
  const page = Math.max(1, Number(first(searchParams.page)) || 1);
  const filters = {
    in_stock: first(searchParams.in_stock) === "1",
    sale: first(searchParams.sale) === "1",
    min_price: first(searchParams.min_price) ?? "",
    max_price: first(searchParams.max_price) ?? "",
  };

  const data = await api.products({
    ...baseQuery,
    ordering: sort,
    page,
    in_stock: filters.in_stock || undefined,
    sale: filters.sale || undefined,
    min_price: filters.min_price,
    max_price: filters.max_price,
  });
  const pages = Math.ceil(data.count / 12);

  const pageHref = (target: number) => {
    const params = new URLSearchParams(hidden);
    if (sort !== "-created_at") params.set("sort", sort);
    if (filters.in_stock) params.set("in_stock", "1");
    if (filters.sale) params.set("sale", "1");
    if (filters.min_price) params.set("min_price", filters.min_price);
    if (filters.max_price) params.set("max_price", filters.max_price);
    if (target > 1) params.set("page", String(target));
    return params.size ? `${basePath}?${params}` : basePath;
  };

  return (
    <div className="space-y-5">
      <form
        action={basePath}
        className="card flex flex-wrap items-end gap-x-5 gap-y-3 p-4 text-sm"
        aria-label="Фильтры"
      >
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label className="flex flex-col gap-1">
          <span className="text-muted text-xs">Сортировка</span>
          <select name="sort" defaultValue={sort} className="input w-48">
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
              defaultValue={filters.min_price}
              className="input w-24"
            />
            <input
              type="number"
              name="max_price"
              min={0}
              placeholder="до"
              aria-label="Цена до"
              defaultValue={filters.max_price}
              className="input w-24"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 py-2.5">
          <input
            type="checkbox"
            name="in_stock"
            value="1"
            defaultChecked={filters.in_stock}
            className="accent-primary size-4"
          />
          В наличии
        </label>
        <label className="flex items-center gap-2 py-2.5">
          <input
            type="checkbox"
            name="sale"
            value="1"
            defaultChecked={filters.sale}
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
              aria-current={number === page ? "page" : undefined}
              className={`flex size-10 items-center justify-center rounded-lg text-sm font-bold ${
                number === page
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
