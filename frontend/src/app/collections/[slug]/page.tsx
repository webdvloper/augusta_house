import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { ProductListing, type SearchParams } from "@/components/ProductListing";
import { Breadcrumbs, PageSkeleton } from "@/components/Ui";
import { api, ApiError } from "@/lib/api";

const getCollection = cache((slug: string) => api.collection(slug));

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug).catch(() => null);
  return { title: collection?.name ?? "Подборка" };
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const collection = await getCollection(slug).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <Breadcrumbs
        items={[{ name: "Подборки", href: "/collections" }, { name: collection.name }]}
      />
      <h1 className="text-4xl sm:text-5xl">{collection.name}</h1>
      <p className="text-muted mt-1 mb-5 text-sm">{collection.description}</p>
      <ProductListing
        basePath={`/collections/${slug}`}
        baseQuery={{ collection: slug }}
        searchParams={query}
      />
    </>
  );
}

export default function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
