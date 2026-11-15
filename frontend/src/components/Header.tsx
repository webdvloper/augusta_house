import Link from "next/link";
import { Suspense } from "react";

import { api } from "@/lib/api";
import { company } from "@/lib/format";

import { HeaderActions } from "./HeaderActions";
import { Icon } from "./Icon";

function SearchForm() {
  return (
    <form action="/search" role="search" className="relative flex-1">
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

async function CategoryLinks() {
  const categories = await api.categories().catch(() => []);
  return categories
    .flatMap((category) => (category.children.length ? category.children : [category]))
    .map((category) => (
      <Link
        key={category.slug}
        href={`/catalog/${category.slug}`}
        className="hover:text-primary shrink-0 py-2.5 transition-colors"
      >
        {category.name}
      </Link>
    ));
}

export function Header() {
  return (
    <header className="border-border bg-surface sticky top-0 z-40 border-b">
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-2.5 py-2.5 md:flex-nowrap md:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="На главную">
          <img src="/emblem.png" alt="" width={44} height={44} className="size-10 md:size-11" />
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
        <div className="container-page no-scrollbar flex min-h-10 items-center gap-6 overflow-x-auto">
          <Link
            href="/collections/rasprodazha"
            className="bg-secondary text-text shrink-0 rounded-full px-3 py-1 font-bold"
          >
            Распродажа
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
