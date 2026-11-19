import Link from "next/link";
import { Suspense } from "react";

import { api } from "@/lib/api";
import { asset, route } from "@/lib/config";
import { company } from "@/lib/format";

import { HeaderActions } from "./HeaderActions";
import { Icon } from "./Icon";

function SearchForm() {
  return (
    <form action={route("/search")} role="search" className="relative flex-1">
      <Icon
        name="search"
        className="text-primary/70 pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2"
      />
      <input
        type="search"
        name="q"
        required
        placeholder="Найти ткань, шторы, декор…"
        aria-label="Поиск по каталогу"
        className="bg-background placeholder:text-primary/60 focus:border-primary w-full rounded-full border border-transparent py-2.5 pr-4 pl-11 text-sm outline-none"
      />
    </form>
  );
}

/** Разделы каталога из админки; вложенные рубрики — в выпадающем меню. */
async function CategoryLinks() {
  const categories = await api.categories().catch(() => []);
  return categories
    .filter((section) => section.product_count > 0)
    .map((section) => {
      const children = section.children.filter((child) => child.product_count > 0);
      return (
        <div key={section.slug} className="group relative shrink-0">
          <Link
            href={`/catalog/${section.slug}`}
            className="hover:text-primary flex items-center gap-1 py-2.5 transition-colors"
          >
            {section.name}
            {children.length > 0 && (
              <Icon
                name="chevron"
                className="size-3.5 rotate-90 opacity-60 transition-transform group-focus-within:-rotate-90 group-hover:-rotate-90"
              />
            )}
          </Link>
          {children.length > 0 && (
            <div className="invisible absolute top-full left-0 z-50 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="card min-w-56 p-2 shadow-xl">
                {children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/catalog/${child.slug}`}
                      className="hover:bg-mint hover:text-primary flex items-center justify-between gap-4 rounded-lg px-3 py-2"
                    >
                      {child.name}
                      <span className="text-muted text-xs">{child.product_count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    });
}

export function Header() {
  return (
    <header className="border-border bg-surface/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-2.5 py-2.5 md:flex-nowrap md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="На главную">
          <img
            src={asset("/emblem.png")}
            alt=""
            width={44}
            height={44}
            className="size-10 md:size-11"
          />
          <span className="font-display text-primary text-xl leading-none font-bold md:text-2xl">
            {company.name}
          </span>
        </Link>

        <Link href="/catalog" className="btn-primary hidden md:inline-flex">
          <Icon name="catalog" /> Каталог
        </Link>

        <a
          href={company.phoneHref}
          className="text-primary ml-auto text-sm font-bold whitespace-nowrap md:order-last md:ml-0 lg:hidden"
        >
          {company.phone}
        </a>

        <div className="order-last flex w-full md:order-none md:w-auto md:flex-1">
          <SearchForm />
        </div>

        <a
          href={company.phoneHref}
          className="text-primary hidden text-sm font-bold whitespace-nowrap lg:block"
        >
          {company.phone}
        </a>
        <HeaderActions />
      </div>

      <nav
        aria-label="Рубрики"
        className="border-border/70 hidden border-t text-sm font-medium md:block"
      >
        <div className="container-page flex min-h-10 flex-wrap items-center gap-x-6">
          <Link
            href="/catalog/all?sale=1"
            className="bg-secondary text-text flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-bold transition hover:brightness-105"
          >
            <Icon name="tag" className="size-4" /> Скидки
          </Link>
          <Link href="/collections" className="hover:text-primary shrink-0 py-2.5">
            Подборки
          </Link>
          <Suspense fallback={null}>
            <CategoryLinks />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
