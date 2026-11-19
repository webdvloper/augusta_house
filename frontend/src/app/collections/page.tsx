import type { Metadata } from "next";
import { Suspense } from "react";

import { ApiNotice, CollectionCard } from "@/components/Sections";
import { Breadcrumbs, EmptyState } from "@/components/Ui";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Подборки" };

async function CollectionList() {
  const collections = await api.collections(4).catch(() => null);
  if (!collections) return <ApiNotice />;
  const visible = collections.filter((collection) => collection.product_count > 0);
  if (!visible.length) {
    return <EmptyState title="Подборок пока нет" text="Скоро здесь появятся готовые сочетания." />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((collection) => (
        <li key={collection.slug}>
          <CollectionCard collection={collection} />
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
