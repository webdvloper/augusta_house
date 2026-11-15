import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductListing, type SearchParams } from "@/components/ProductListing";
import { Breadcrumbs, EmptyState, PageSkeleton } from "@/components/Ui";

export const metadata: Metadata = { title: "Поиск" };

async function Content({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const q = (Array.isArray(query.q) ? query.q[0] : query.q)?.trim().slice(0, 100) ?? "";

  return (
    <>
      <Breadcrumbs items={[{ name: "Поиск" }]} />
      <h1 className="mb-5 text-4xl sm:text-5xl">{q ? `Поиск: «${q}»` : "Поиск"}</h1>
      {q ? (
        <ProductListing
          basePath="/search"
          baseQuery={{ search: q }}
          searchParams={query}
          hidden={{ q }}
        />
      ) : (
        <EmptyState
          title="Что будем искать?"
          text="Введите название ткани, цвет или артикул в строке поиска."
        />
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
