import Link from "next/link";
import type { ReactNode } from "react";

import { asset } from "@/lib/config";

import { Icon } from "./Icon";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-muted mb-4 text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-primary">
            Главная
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.name} className="flex items-center gap-1.5">
            <Icon name="chevron" className="size-3" />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.name}
              </Link>
            ) : (
              <span className="text-text" aria-current="page">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionTitle({
  title,
  href,
  linkLabel,
  note,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  note?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div>
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {note && <p className="text-muted mt-1 text-sm">{note}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-primary flex items-center gap-1 text-sm font-bold hover:underline"
        >
          {linkLabel ?? "Смотреть все"} <Icon name="chevron" className="size-4" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <img src={asset("/emblem.png")} alt="" width={72} height={72} className="opacity-90" />
      <p className="font-display text-2xl font-bold">{title}</p>
      {text && <p className="text-muted max-w-md text-sm">{text}</p>}
      {action}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-page space-y-4 py-8" role="status" aria-label="Загрузка">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
