import Link from "next/link";

import { api } from "@/lib/api";
import { productsWord } from "@/lib/format";
import type { Category } from "@/lib/types";

import { ProductGrid } from "./ProductCard";
import { SectionTitle } from "./Ui";

export function ApiNotice() {
  return (
    <p className="card text-muted p-6 text-center text-sm">
      Каталог временно недоступен. Проверьте, что сервер магазина запущен, и обновите страницу.
    </p>
  );
}

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/catalog/${category.slug}`}
      className="card group hover:border-primary relative flex aspect-[4/3] flex-col overflow-hidden p-3.5 transition-colors sm:p-4"
    >
      <span className="relative z-10 text-sm leading-tight font-bold sm:text-base">
        {category.name}
      </span>
      <span className="text-muted relative z-10 text-xs">
        {productsWord(category.product_count)}
      </span>
      {category.image && (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="absolute -right-3 -bottom-3 size-[62%] rounded-tl-[2rem] object-cover shadow-md transition-transform duration-500 group-hover:scale-105"
        />
      )}
    </Link>
  );
}

/** Плитки рубрик второго уровня — как быстрый вход в каталог. */
export async function CategoryTiles() {
  const categories = await api.categories().catch(() => null);
  if (!categories) return <ApiNotice />;
  const tiles = categories.flatMap((category) =>
    category.children.length ? category.children : [category],
  );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {tiles.map((category) => (
        <CategoryTile key={category.slug} category={category} />
      ))}
    </div>
  );
}

export async function CollectionsShowcase({ limit = 3 }: { limit?: number }) {
  const collections = await api.collections(4).catch(() => null);
  if (!collections) return <ApiNotice />;
  return collections
    .filter((collection) => collection.preview.length > 0)
    .slice(0, limit)
    .map((collection) => (
      <section key={collection.slug}>
        <SectionTitle
          title={collection.name}
          note={collection.description}
          href={`/collections/${collection.slug}`}
          linkLabel="Вся подборка"
        />
        <ProductGrid products={collection.preview} />
      </section>
    ));
}

export async function PopularProducts({ title = "Популярное" }: { title?: string }) {
  const data = await api
    .products({ ordering: "-views_count", in_stock: true, page_size: 4 })
    .catch(() => null);
  if (!data?.results.length) return null;
  return (
    <section>
      <SectionTitle title={title} href="/catalog/all?sort=-views_count" />
      <ProductGrid products={data.results} />
    </section>
  );
}
