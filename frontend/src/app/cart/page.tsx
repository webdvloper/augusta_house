import type { Metadata } from "next";
import { Suspense } from "react";

import { CartView } from "@/components/CartView";
import { ProductGridSkeleton } from "@/components/ProductCard";
import { PopularProducts } from "@/components/Sections";
import { Breadcrumbs } from "@/components/Ui";

export const metadata: Metadata = { title: "Корзина" };

export default function CartPage() {
  return (
    <div className="container-page space-y-12 py-6 sm:py-8">
      <div>
        <Breadcrumbs items={[{ name: "Корзина" }]} />
        <h1 className="mb-5 text-4xl sm:text-5xl">Корзина</h1>
        <CartView />
      </div>
      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <PopularProducts title="Рекомендуем" />
      </Suspense>
    </div>
  );
}
