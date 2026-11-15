"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";
import { company, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

import { Icon } from "./Icon";
import { EmptyState, PageSkeleton } from "./Ui";

export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="card mx-auto max-w-2xl p-6 sm:p-10">
      <span className="bg-secondary text-text mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon name="check" className="size-6" />
      </span>
      <h1 className="text-3xl sm:text-4xl">Заказ {order.number} принят</h1>
      {IS_STATIC ? (
        <p className="bg-mint mt-3 rounded-lg p-3 text-sm">
          Это демо-версия сайта: заказ никуда не отправлен и не сохранён. Чтобы купить товар,
          позвоните нам: {company.phone}.
        </p>
      ) : (
        <p className="text-muted mt-2 text-sm">
          {order.customer_name}, спасибо! Менеджер позвонит по номеру {order.customer_phone}, чтобы
          подтвердить наличие и согласовать оплату и доставку.
        </p>
      )}

      <dl className="border-border mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-6 text-sm">
        <dt className="text-muted">Статус</dt>
        <dd className="font-semibold">{order.status_label}</dd>
        <dt className="text-muted">Доставка</dt>
        <dd>
          {order.delivery_label}
          {order.address && ` — ${order.address}`}
        </dd>
        <dt className="text-muted">Оформлен</dt>
        <dd>{new Date(order.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</dd>
      </dl>

      <ul className="divide-border border-border mt-6 divide-y border-y text-sm">
        {order.items.map((item) => (
          <li key={item.sku} className="flex justify-between gap-4 py-3">
            <span>
              {item.name}
              <span className="text-muted block text-xs">
                Арт. {item.sku} · {item.quantity} × {formatPrice(item.price)}
              </span>
            </span>
            <span className="font-bold whitespace-nowrap">{formatPrice(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between">
        <span className="text-muted text-sm">Итого без доставки</span>
        <span className="text-2xl font-extrabold">{formatPrice(order.total)}</span>
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/catalog" className="btn-primary">
          Продолжить покупки
        </Link>
        <a href={company.phoneHref} className="btn-outline">
          Позвонить нам
        </a>
      </div>
    </div>
  );
}

/** Демо-заказ читается из sessionStorage браузера. */
export function DemoOrder() {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    api
      .order("demo")
      .then(setOrder)
      .catch(() => setOrder(null));
  }, []);

  if (order === undefined) return <PageSkeleton />;
  if (order === null) {
    return (
      <EmptyState
        title="Заказ не найден"
        text="Демо-заказ хранится только до закрытия вкладки."
        action={
          <Link href="/catalog" className="btn-primary">
            Перейти в каталог
          </Link>
        }
      />
    );
  }
  return <OrderDetails order={order} />;
}
