import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { BuyBox } from "@/components/BuyBox";
import { Gallery } from "@/components/Gallery";
import { Icon } from "@/components/Icon";
import { ProductGrid } from "@/components/ProductCard";
import { Breadcrumbs, PageSkeleton, SectionTitle } from "@/components/Ui";
import { allProducts, api, ApiError } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";
import { formatPrice } from "@/lib/format";

// cache: карточка и метаданные делят один запрос, просмотр засчитывается один раз.
const getProduct = cache((sku: string) => api.product(sku));

export async function generateStaticParams() {
  const products = IS_STATIC ? await allProducts() : [];
  // Пустой список Next не принимает: пока в базе нет товаров, отдаём заглушку (→ 404).
  return products.length ? products.map(({ sku }) => ({ sku })) : [{ sku: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[sku]">): Promise<Metadata> {
  const { sku } = await params;
  const product = await getProduct(decodeURIComponent(sku)).catch(() => null);
  return product
    ? { title: product.name, description: product.description.slice(0, 160) }
    : { title: "Товар не найден" };
}

async function Content({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const product = await getProduct(decodeURIComponent(sku)).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Каталог", href: "/catalog" },
          ...product.breadcrumbs.map((crumb) => ({
            name: crumb.name,
            href: `/catalog/${crumb.slug}`,
          })),
          { name: product.name },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <Gallery photos={product.photos} name={product.name} />

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {product.is_new && (
              <span className="bg-secondary text-text rounded-full px-3 py-1 text-xs font-bold">
                Новинка
              </span>
            )}
            {product.discount_percent > 0 && (
              <span className="bg-sale rounded-full px-3 py-1 text-xs font-bold text-white">
                Скидка {product.discount_percent}%
              </span>
            )}
          </div>
          <h1 className="text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          <p className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>Артикул: {product.sku}</span>
            <span className="flex items-center gap-1">
              <Icon name="eye" className="size-4" /> {product.views_count} просмотров
            </span>
          </p>

          <p className="flex flex-wrap items-baseline gap-x-3">
            <span
              className={`text-4xl font-extrabold ${product.discount_percent ? "text-sale" : ""}`}
            >
              {formatPrice(product.price)}
            </span>
            <span className="text-muted">за {product.unit}</span>
            {product.old_price && product.discount_percent > 0 && (
              <s className="text-muted text-lg">{formatPrice(product.old_price)}</s>
            )}
          </p>

          <p className="text-sm font-semibold">
            {product.in_stock ? (
              <span className="text-primary flex items-center gap-1.5">
                <Icon name="check" className="size-4" /> В наличии: {product.stock} {product.unit}
              </span>
            ) : (
              <span className="text-muted">Нет в наличии</span>
            )}
          </p>

          <BuyBox product={product} />

          <ul className="border-border text-muted space-y-2 border-t pt-5 text-sm">
            <li className="flex items-center gap-2">
              <Icon name="truck" className="text-primary size-5 shrink-0" /> Доставка по России или
              самовывоз в Химках
            </li>
            <li className="flex items-center gap-2">
              <Icon name="phone" className="text-primary size-5 shrink-0" /> Менеджер подтвердит
              заказ по телефону
            </li>
          </ul>
          <Link href="/info" className="text-primary text-sm font-bold hover:underline">
            Условия доставки, оплаты и возврата
          </Link>
        </div>
      </div>

      {product.description && (
        <section className="card mt-8 p-6 sm:p-8">
          <h2 className="mb-3 text-2xl sm:text-3xl">Описание</h2>
          <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </section>
      )}

      {product.related.length > 0 && (
        <section className="mt-12">
          <SectionTitle
            title="Из этой рубрики"
            href={`/catalog/${product.category.slug}`}
            linkLabel="Вся рубрика"
          />
          <ProductGrid products={product.related} />
        </section>
      )}
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/product/[sku]">) {
  return (
    <div className="container-page py-6 sm:py-8">
      <Suspense fallback={<PageSkeleton />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
