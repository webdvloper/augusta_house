import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Icon } from "@/components/Icon";
import { ApiNotice } from "@/components/Sections";
import { Breadcrumbs } from "@/components/Ui";
import { api } from "@/lib/api";
import { asset } from "@/lib/config";
import { productsWord } from "@/lib/format";

export const metadata: Metadata = { title: "Подборки" };

async function CollectionList() {
  const collections = await api.collections(3).catch(() => null);
  if (!collections) return <ApiNotice />;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {collections.map((collection) => (
        <li key={collection.slug}>
          <Link
            href={`/collections/${collection.slug}`}
            className="card group hover:border-primary flex items-center gap-4 overflow-hidden p-4 transition-colors"
          >
            <span className="flex shrink-0 -space-x-6">
              {collection.preview.map((product) => (
                <img
                  key={product.sku}
                  src={product.image ?? asset("/emblem.png")}
                  alt=""
                  loading="lazy"
                  className="border-surface size-20 rounded-xl border-2 object-cover shadow-sm"
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block text-2xl leading-tight font-bold">
                {collection.name}
              </span>
              <span className="text-muted block text-sm">{collection.description}</span>
              <span className="text-primary mt-1 block text-xs font-bold">
                {productsWord(collection.product_count)}
              </span>
            </span>
            <Icon name="chevron" className="text-primary size-5 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CollectionsPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ name: "Подборки" }]} />
      <h1 className="mb-2 text-4xl sm:text-5xl">Подборки</h1>
      <p className="text-muted mb-6 text-sm">Готовые сочетания тканей и декора от Augusta House.</p>
      <Suspense fallback={<div className="skeleton h-64 w-full" />}>
        <CollectionList />
      </Suspense>
    </div>
  );
}
