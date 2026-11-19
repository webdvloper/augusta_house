import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { ClientListing } from "@/components/ClientListing";
import { ProductGridSkeleton } from "@/components/ProductCard";
import { ProductListing, type SearchParams } from "@/components/ProductListing";
import { Breadcrumbs, PageSkeleton } from "@/components/Ui";
import { api, ApiError } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";

const getCollection = cache((slug: string) => api.collection(slug));

export async function generateStaticParams() {
  const collections = IS_STATIC ? await api.collections(0) : [];
  return collections.length
    ? collections.map(({ slug }) => ({ slug }))
    : [{ slug: "__placeholder__" }];
}

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
  const { slug } = await params;
  const collection = await getCollection(slug).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <Breadcrumbs
        items={[{ name: "Подборки", href: "/collections" }, { name: collection.name }]}
      />
      <header className="bg-primary-dark relative mb-6 overflow-hidden rounded-3xl text-white">
        {collection.image && (
          <img
            src={collection.image}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-45"
          />
        )}
        <div className="from-primary-dark via-primary-dark/80 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="relative max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-secondary text-xs font-bold tracking-[0.2em] uppercase">Подборка</p>
          <h1 className="mt-2 text-4xl sm:text-6xl">{collection.name}</h1>
          {collection.description && (
            <p className="text-mint/90 mt-2 text-sm sm:text-base">{collection.description}</p>
          )}
        </div>
      </header>
      {IS_STATIC ? (
        <Suspense fallback={<ProductGridSkeleton />}>
          <ClientListing basePath={`/collections/${slug}`} baseQuery={{ collection: slug }} />
        </Suspense>
      ) : (
        <ProductListing
          basePath={`/collections/${slug}`}
          baseQuery={{ collection: slug }}
          searchParams={await searchParams}
        />
      )}
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
