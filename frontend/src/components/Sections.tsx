import Link from "next/link";

import { api } from "@/lib/api";
import { asset } from "@/lib/config";
import { productsWord } from "@/lib/format";
import type { Category, Collection } from "@/lib/types";

import { Icon } from "./Icon";
import { ProductGrid } from "./ProductCard";
import { EmptyState, SectionTitle } from "./Ui";

export function ApiNotice() {
  return (
    <p className="card text-muted p-6 text-center text-sm">
      Каталог временно недоступен. Проверьте, что сервер магазина запущен, и обновите страницу.
    </p>
  );
}

/** Каталог пуст: товары и рубрики ещё не добавлены в админке. */
export function CatalogEmpty() {
  return (
    <EmptyState
      title="Каталог скоро появится"
      text="Мы готовим витрину: ткани, шторы и декор вот-вот будут здесь. А пока можно позвонить нам — подберём всё по телефону."
    />
  );
}

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/catalog/${category.slug}`}
      className="group bg-mint shadow-card relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl sm:aspect-[4/3]"
    >
      {category.image ? (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <img
          src={asset("/emblem.png")}
          alt=""
          className="absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-2/3 opacity-60"
        />
      )}
      <span
        aria-hidden
        className="from-text/85 via-text/30 absolute inset-0 bg-gradient-to-t to-transparent"
      />
      <span className="relative flex items-end justify-between gap-2 p-3.5 text-white sm:p-4">
        <span>
          <span className="block text-sm leading-tight font-bold sm:text-base">
            {category.name}
          </span>
          <span className="block text-xs text-white/80">
            {productsWord(category.product_count)}
          </span>
        </span>
        <span className="bg-secondary text-text flex size-8 shrink-0 translate-x-2 items-center justify-center rounded-full opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
          <Icon name="arrow" className="size-4" />
        </span>
      </span>
    </Link>
  );
}

/** Плитки рубрик второго уровня — как быстрый вход в каталог. */
export async function CategoryTiles() {
  const categories = await api.categories().catch(() => null);
  if (!categories) return <ApiNotice />;
  const tiles = categories
    .flatMap((category) => (category.children.length ? category.children : [category]))
    .filter((category) => category.product_count > 0);
  if (!tiles.length) return <CatalogEmpty />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {tiles.map((category) => (
        <CategoryTile key={category.slug} category={category} />
      ))}
    </div>
  );
}

export function CollectionCard({ collection }: { collection: Collection }) {
  const cover = collection.image ?? collection.preview[0]?.image ?? null;
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="card group hover:border-primary flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="bg-mint relative block aspect-[16/9] overflow-hidden">
        {cover && (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="absolute right-3 bottom-3 flex -space-x-3">
          {collection.preview
            .filter((product) => product.image && product.image !== cover)
            .slice(0, 3)
            .map((product) => (
              <img
                key={product.sku}
                src={product.image!}
                alt=""
                loading="lazy"
                className="size-12 rounded-full border-2 border-white object-cover shadow"
              />
            ))}
        </span>
      </span>
      <span className="flex flex-1 items-center gap-3 p-4 sm:p-5">
        <span className="min-w-0 flex-1">
          <span className="font-display block text-2xl leading-tight font-bold">
            {collection.name}
          </span>
          {collection.description && (
            <span className="text-muted mt-0.5 block text-sm">{collection.description}</span>
          )}
          <span className="text-primary mt-1.5 block text-xs font-bold">
            {productsWord(collection.product_count)}
          </span>
        </span>
        <span className="bg-mint text-primary group-hover:bg-primary flex size-10 shrink-0 items-center justify-center rounded-full transition group-hover:text-white">
          <Icon name="arrow" className="size-5" />
        </span>
      </span>
    </Link>
  );
}

/** Подборки с отметкой «На главной» — по ленте товаров на каждую. */
export async function CollectionsShowcase({ limit = 3 }: { limit?: number }) {
  const collections = await api.collections(4, true).catch(() => null);
  if (!collections) return null;
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
    .products({ ordering: "-views_count", in_stock: true, page_size: 8 })
    .catch(() => null);
  if (!data?.results.length) return null;
  return (
    <section>
      <SectionTitle title={title} href="/catalog/all?sort=-views_count" />
      <ProductGrid products={data.results} />
    </section>
  );
}
