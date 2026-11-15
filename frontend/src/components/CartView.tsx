"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { IS_STATIC } from "@/lib/config";
import { formatPrice, productsWord } from "@/lib/format";
import { clearCart, setQuantity, useCart, useHydrated } from "@/lib/store";
import type { DeliveryMethod, Product } from "@/lib/types";

import { QuantityInput } from "./BuyBox";
import { Icon } from "./Icon";
import { EmptyState } from "./Ui";
import { useProducts } from "./useProducts";

const DELIVERY: { value: DeliveryMethod; label: string; note: string }[] = [
  { value: "pickup", label: "Самовывоз", note: "Склад в Химках, бесплатно" },
  { value: "courier", label: "Курьер", note: "Москва и область" },
  { value: "post", label: "Почта России", note: "По тарифам перевозчика" },
  { value: "cdek", label: "СДЭК", note: "До пункта выдачи или двери" },
];

function CartRow({ product, quantity }: { product: Product; quantity: number }) {
  const overStock = quantity > product.stock;
  return (
    <li className="flex gap-3 py-4 sm:gap-4">
      <Link
        href={`/product/${encodeURIComponent(product.sku)}`}
        className="bg-background size-20 shrink-0 overflow-hidden rounded-xl sm:size-24"
      >
        {product.image && (
          <img src={product.image} alt="" className="size-full object-cover" loading="lazy" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link
          href={`/product/${encodeURIComponent(product.sku)}`}
          className="hover:text-primary line-clamp-2 text-sm font-semibold"
        >
          {product.name}
        </Link>
        <p className="text-muted text-xs">
          Арт. {product.sku} · {formatPrice(product.price)} / {product.unit}
        </p>
        {product.stock === 0 ? (
          <p className="text-sale text-xs font-semibold">Товар закончился — удалите его</p>
        ) : overStock ? (
          <p className="text-sale text-xs font-semibold">
            В наличии только {product.stock} {product.unit}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {product.stock > 0 && (
            <QuantityInput
              value={Math.min(quantity, product.stock)}
              max={product.stock}
              unit={product.unit}
              onChange={(value) => setQuantity(product.sku, value)}
            />
          )}
          <p className="ml-auto font-extrabold">{formatPrice(Number(product.price) * quantity)}</p>
          <button
            type="button"
            onClick={() => setQuantity(product.sku, 0)}
            aria-label={`Удалить «${product.name}» из корзины`}
            className="text-muted hover:text-sale p-1"
          >
            <Icon name="trash" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useCart();
  const skus = Object.keys(cart);
  const { products, loading, error } = useProducts(skus, hydrated);

  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!hydrated || loading) {
    return <div className="skeleton h-72 w-full" role="status" aria-label="Загрузка корзины" />;
  }
  if (error) return <EmptyState title="Не удалось загрузить корзину" text={error} />;
  if (!skus.length) {
    return (
      <EmptyState
        title="В корзине пока пусто"
        text="Подберём что-нибудь? Загляните в каталог или в подборки ниже."
        action={
          <Link href="/catalog" className="btn-primary">
            Начать покупки
          </Link>
        }
      />
    );
  }

  // Товары, скрытые с витрины после добавления в корзину, API уже не возвращает.
  const missing = skus.filter((sku) => !products.some((product) => product.sku === sku));
  const total = products.reduce(
    (sum, product) => sum + Number(product.price) * (cart[product.sku] ?? 0),
    0,
  );
  const units = products.length;
  const blocked =
    missing.length > 0 || products.some((product) => (cart[product.sku] ?? 0) > product.stock);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError(null);
    try {
      const order = await api.createOrder({
        customer_name: String(form.get("name") ?? ""),
        customer_email: String(form.get("email") ?? ""),
        customer_phone: String(form.get("phone") ?? ""),
        delivery_method: delivery,
        address: delivery === "pickup" ? "" : String(form.get("address") ?? ""),
        comment: String(form.get("comment") ?? ""),
        items: products.map((product) => ({ sku: product.sku, quantity: cart[product.sku] })),
      });
      clearCart();
      router.push(`/order/${order.public_id}`);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Не удалось оформить заказ.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
      <section className="card px-4 sm:px-6" aria-label="Товары в корзине">
        {missing.length > 0 && (
          <div className="bg-mint mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm">
            <span>Некоторые товары больше не продаются ({missing.join(", ")}).</span>
            <button
              type="button"
              className="text-primary font-bold"
              onClick={() => missing.forEach((sku) => setQuantity(sku, 0))}
            >
              Убрать их
            </button>
          </div>
        )}
        <ul className="divide-border divide-y">
          {products.map((product) => (
            <CartRow key={product.sku} product={product} quantity={cart[product.sku] ?? 0} />
          ))}
        </ul>
      </section>

      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6 lg:sticky lg:top-36">
        <h2 className="text-2xl">Оформление заказа</h2>

        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Имя</span>
          <input name="name" required maxLength={120} autoComplete="name" className="input" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Телефон</span>
          <input
            name="phone"
            type="tel"
            required
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            className="input"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>

        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1.5 font-semibold">Доставка</legend>
          <div className="grid grid-cols-2 gap-2">
            {DELIVERY.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-2.5 ${
                  delivery === option.value ? "border-primary bg-mint/60" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={option.value}
                  checked={delivery === option.value}
                  onChange={() => setDelivery(option.value)}
                  className="sr-only"
                />
                <span className="block font-semibold">{option.label}</span>
                <span className="text-muted block text-xs">{option.note}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {delivery !== "pickup" && (
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold">Адрес доставки</span>
            <input
              name="address"
              required
              maxLength={255}
              autoComplete="street-address"
              className="input"
            />
          </label>
        )}
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Комментарий</span>
          <textarea name="comment" rows={2} className="input resize-y" />
        </label>

        <div className="border-border flex items-baseline justify-between border-t pt-4">
          <span className="text-muted text-sm">{productsWord(units)} на сумму</span>
          <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
        </div>

        {formError && (
          <p role="alert" className="text-sale bg-sale/10 rounded-lg p-3 text-sm font-semibold">
            {formError}
          </p>
        )}
        <button type="submit" disabled={submitting || blocked} className="btn-primary w-full py-3">
          {submitting ? "Оформляем…" : "Оформить заказ"}
        </button>
        <p className="text-muted text-xs">
          {IS_STATIC
            ? "Это демо-версия: заказ не будет отправлен, данные остаются в вашем браузере."
            : "Онлайн-оплата пока не подключена: менеджер свяжется с вами, подтвердит наличие и согласует оплату и стоимость доставки."}
        </p>
      </form>
    </div>
  );
}
