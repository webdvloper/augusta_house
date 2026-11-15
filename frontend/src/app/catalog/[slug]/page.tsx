import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { ClientListing } from "@/components/ClientListing";
import { ProductGridSkeleton } from "@/components/ProductCard";
import { ProductListing, type SearchParams } from "@/components/ProductListing";
import { Breadcrumbs, PageSkeleton } from "@/components/Ui";
import { api } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";
import type { Category } from "@/lib/types";

/** Ищет рубрику в дереве и возвращает путь от корня до неё. */
function findPath(tree: Category[], slug: string, trail: Category[] = []): Category[] | null {
  for (const node of tree) {
    const path = [...trail, node];
    if (node.slug === slug) return path;
    const nested = findPath(node.children, slug, path);
    if (nested) return nested;
  }
  return null;
}

const getTree = cache(() => api.categories());

const flatten = (tree: Category[]): Category[] =>
  tree.flatMap((node) => [node, ...flatten(node.children)]);

export async function generateStaticParams() {
  if (!IS_STATIC) return [{ slug: "__placeholder__" }];
  return [{ slug: "all" }, ...flatten(await getTree()).map(({ slug }) => ({ slug }))];
}

export async function generateMetadata({
  params,
}: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "all") return { title: "Все товары" };
  const tree = await getTree().catch(() => []);
  return { title: findPath(tree, slug)?.at(-1)?.name ?? "Каталог" };
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const all = slug === "all";

  let path: Category[] = [];
  if (!all) {
    const tree = await getTree();
    path = findPath(tree, slug) ?? notFound();
  }
  const category = path.at(-1);
  const title = category?.name ?? "Все товары";
  const siblings = category?.children.length ? category.children : (path.at(-2)?.children ?? []);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Каталог", href: "/catalog" },
          ...path.slice(0, -1).map((node) => ({ name: node.name, href: `/catalog/${node.slug}` })),
          { name: title },
        ]}
      />
      <h1 className="mb-5 text-4xl sm:text-5xl">{title}</h1>

      {siblings.length > 0 && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto text-sm font-semibold">
          {siblings.map((node) => (
            <Link
              key={node.slug}
              href={`/catalog/${node.slug}`}
              aria-current={node.slug === slug ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 ${
                node.slug === slug
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface hover:border-primary"
              }`}
            >
              {node.name}
            </Link>
          ))}
        </div>
      )}

      {IS_STATIC ? (
        <Suspense fallback={<ProductGridSkeleton />}>
          <ClientListing basePath={`/catalog/${slug}`} baseQuery={all ? {} : { category: slug }} />
        </Suspense>
      ) : (
        <ProductListing
          basePath={`/catalog/${slug}`}
          baseQuery={all ? {} : { category: slug }}
          searchParams={await searchParams}
        />
      )}
    </>
  );
}

export default function CategoryPage({ params, searchParams }: PageProps<"/catalog/[slug]">) {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
