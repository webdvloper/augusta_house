"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cartCount, useCart, useFavorites } from "@/lib/store";

import { Icon, type IconName } from "./Icon";

const items: { href: string; icon: IconName; label: string }[] = [
  { href: "/", icon: "home", label: "Главная" },
  { href: "/catalog", icon: "catalog", label: "Каталог" },
  { href: "/cart", icon: "cart", label: "Корзина" },
  { href: "/favorites", icon: "heart", label: "Избранное" },
  { href: "/login", icon: "user", label: "Профиль" },
];

/** Нижняя панель навигации на телефонах. */
export function MobileNav() {
  const pathname = usePathname();
  const cart = useCart();
  const favorites = useFavorites();
  const badges: Record<string, number> = {
    "/cart": cartCount(cart),
    "/favorites": favorites.length,
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map(({ href, icon, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              active ? "text-primary" : "text-muted"
            }`}
          >
            <span className="relative">
              <Icon name={icon} className="size-6" />
              {badges[href] ? (
                <span className="bg-secondary text-text absolute -top-1.5 -right-3 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-bold">
                  {badges[href]}
                </span>
              ) : null}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
