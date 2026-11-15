import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DemoOrder, OrderDetails } from "@/components/OrderDetails";
import { PageSkeleton } from "@/components/Ui";
import { api, ApiError } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";

export const metadata: Metadata = { title: "Заказ оформлен", robots: { index: false } };

// Статичная версия знает единственный адрес — /order/demo.
export function generateStaticParams() {
  return [{ id: IS_STATIC ? "demo" : "__placeholder__" }];
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await api.order(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return <OrderDetails order={order} />;
}

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <div className="container-page py-8 sm:py-12">
      <Suspense fallback={<PageSkeleton />}>
        {IS_STATIC ? <DemoOrder /> : <Content params={params} />}
      </Suspense>
    </div>
  );
}
