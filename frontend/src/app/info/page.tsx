import type { Metadata } from "next";

import { Icon, type IconName } from "@/components/Icon";
import { Breadcrumbs } from "@/components/Ui";
import { company } from "@/lib/format";

export const metadata: Metadata = { title: "Доставка, оплата и возврат" };

const blocks: { id: string; icon: IconName; title: string; items: string[] }[] = [
  {
    id: "delivery",
    icon: "truck",
    title: "Доставка",
    items: [
      `Самовывоз со склада: ${company.address} — бесплатно, по предварительной договорённости.`,
      "Курьер по Москве и Московской области — стоимость рассчитывает менеджер.",
      "СДЭК и Почта России — по тарифам перевозчика, отправка в течение 3 дней для товаров в наличии.",
      "Товары на заказ изготавливаются и отправляются в течение 20 дней.",
    ],
  },
  {
    id: "payment",
    icon: "check",
    title: "Оплата",
    items: [
      "Онлайн-оплата на сайте пока не подключена — это прототип магазина.",
      "После оформления заказа менеджер подтверждает наличие и присылает реквизиты или счёт.",
      "Для юридических лиц — оплата по счёту на расчётный счёт.",
    ],
  },
  {
    id: "returns",
    icon: "leaf",
    title: "Возврат и обмен",
    items: [
      "Ткани и отделочные материалы, отпускаемые на метраж, надлежащего качества обмену и возврату не подлежат (Постановление Правительства РФ № 2463 от 31.12.2020).",
      "Готовые изделия можно вернуть в течение 7 дней после получения, если сохранены товарный вид и ярлыки.",
      "Цветопередача экранов различается: оттенок на фото может немного отличаться от реального. Перед крупным заказом попросите образец.",
      "Если пришёл товар с дефектом — позвоните нам, заменим или вернём деньги.",
    ],
  },
];

export default function InfoPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ name: "Покупателям" }]} />
      <h1 className="mb-6 text-4xl sm:text-5xl">Доставка, оплата и возврат</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        {blocks.map((block) => (
          <section key={block.id} id={block.id} className="card scroll-mt-40 space-y-4 p-6">
            <span className="bg-mint text-primary flex size-11 items-center justify-center rounded-full">
              <Icon name={block.icon} />
            </span>
            <h2 className="text-2xl sm:text-3xl">{block.title}</h2>
            <ul className="space-y-3 text-sm leading-relaxed">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="bg-secondary mt-2 size-1.5 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-muted mt-6 text-sm">
        Остались вопросы? Позвоните:{" "}
        <a href={company.phoneHref} className="text-primary font-bold">
          {company.phone}
        </a>
      </p>
    </div>
  );
}
