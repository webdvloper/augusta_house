import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ApiNotice, CategoryTile } from "@/components/Sections";
import { Breadcrumbs } from "@/components/Ui";
import { api } from "@/lib/api";
import { productsWord } from "@/lib/format";

export const metadata: Metadata = { title: "Каталог" };

async function Rubrics() {
  const categories = await api.categories().catch(() => null);
  if (!categories) return <ApiNotice />;
  return categories.map((section) => (
    <section key={section.slug}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-2xl sm:text-3xl">
          <Link href={`/catalog/${section.slug}`} className="hover:text-primary">
            {section.name}
          </Link>
        </h2>
        <span className="text-muted text-sm">{productsWord(section.product_count)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {(section.children.length ? section.children : [section]).map((category) => (
          <CategoryTile key={category.slug} category={category} />
        ))}
      </div>
    </section>
  ));
}

export default function CatalogPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ name: "Каталог" }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl sm:text-5xl">Каталог</h1>
        <Link href="/catalog/all" className="btn-outline">
          Все товары
        </Link>
      </div>
      <div className="space-y-10">
        <Suspense fallback={<div className="skeleton h-96 w-full" />}>
          <Rubrics />
        </Suspense>
      </div>
    </div>
  );
}
