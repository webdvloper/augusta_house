import Link from "next/link";

import { asset } from "@/lib/config";
import { company } from "@/lib/format";

import { Icon } from "./Icon";

const sections = [
  {
    title: "Каталог",
    links: [
      ["Все рубрики", "/catalog"],
      ["Ткани", "/catalog/tkani"],
      ["Шторы", "/catalog/shtory"],
      ["Декор для штор", "/catalog/dekor-dlya-shtor"],
      ["Подушки", "/catalog/podushki"],
    ],
  },
  {
    title: "Покупателям",
    links: [
      ["Доставка", "/info#delivery"],
      ["Оплата", "/info#payment"],
      ["Возврат и обмен", "/info#returns"],
      ["Подборки", "/collections"],
      ["Частые вопросы", "/#faq"],
    ],
  },
  {
    title: "Компания",
    links: [
      ["О нас", "/#about"],
      ["Контакты", "/#contacts"],
      ["Войти", "/login"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-primary-dark mt-16 text-white">
      <div className="container-page grid gap-x-8 gap-y-2 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-y-8">
        <div className="mb-6 space-y-3 md:mb-0">
          <img
            src={asset("/logo.png")}
            alt={company.name}
            width={96}
            height={96}
            className="rounded-xl"
          />
          <p className="text-mint/90 max-w-xs text-sm">
            Ткани, шторы и интерьерный декор оптом и в розницу с {company.since} года.
          </p>
          <a href={company.phoneHref} className="flex items-center gap-2 font-bold">
            <Icon name="phone" /> {company.phone}
          </a>
          <p className="text-mint/90 flex items-start gap-2 text-sm">
            <Icon name="pin" className="mt-0.5 size-5 shrink-0" /> {company.address}
          </p>
        </div>

        {sections.map((section) => (
          // На телефоне разделы сворачиваются, на десктопе всегда раскрыты.
          <details key={section.title} open className="group border-white/15 max-md:border-t">
            <summary className="flex list-none items-center justify-between py-3 font-bold md:pointer-events-none md:py-0 md:pb-3 [&::-webkit-details-marker]:hidden">
              {section.title}
              <Icon
                name="chevron"
                className="size-4 rotate-90 transition-transform group-open:-rotate-90 md:hidden"
              />
            </summary>
            <ul className="text-mint/90 space-y-2 pb-4 text-sm">
              {section.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-secondary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <div className="border-t border-white/15">
        <p className="container-page text-mint/80 py-4 text-xs">
          © {company.since}–2026 {company.name}. Прототип интернет-магазина: онлайн-оплата не
          подключена, заказ подтверждает менеджер. Цвет ткани на экране может отличаться от
          реального.
        </p>
      </div>
    </footer>
  );
}
