"use client";

import Link from "next/link";

import { cartCount, useCart, useFavorites } from "@/lib/store";

import { Icon, type IconName } from "./Icon";

function Action({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: IconName;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="text-primary hover:text-primary-dark relative flex flex-col items-center gap-0.5 text-[11px] font-medium"
    >
      <Icon name={icon} className="size-6" />
      {label}
      {badge ? (
        <span className="bg-secondary text-text absolute -top-1.5 right-0 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-bold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Иконки шапки на десктопе; на телефоне их заменяет нижняя навигация. */
export function HeaderActions() {
  const cart = useCart();
  const favorites = useFavorites();
  return (
    <div className="hidden items-center gap-5 md:flex">
      <Action href="/favorites" icon="heart" label="Избранное" badge={favorites.length} />
      <Action href="/cart" icon="cart" label="Корзина" badge={cartCount(cart)} />
      <Action href="/login" icon="user" label="Войти" />
    </div>
  );
}
