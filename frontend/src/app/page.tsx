import { Suspense } from "react";

import { Faq } from "@/components/Faq";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Icon, type IconName } from "@/components/Icon";
import { ProductGridSkeleton } from "@/components/ProductCard";
import { CategoryTiles, CollectionsShowcase, PopularProducts } from "@/components/Sections";
import { SectionTitle } from "@/components/Ui";
import { asset } from "@/lib/config";
import { company } from "@/lib/format";

const benefits: { icon: IconName; title: string; text: string }[] = [
  { icon: "leaf", title: "С 2001 года", text: "Поставщик тканей и производитель текстиля" },
  { icon: "ruler", title: "От одного метра", text: "Ткани, шнуры и тесьма метражом" },
  { icon: "truck", title: "Доставка по России", text: "Курьер, СДЭК, Почта или самовывоз" },
  { icon: "phone", title: "Живой менеджер", text: "Подтвердим наличие и поможем с выбором" },
];

const mapUrl = `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(company.address)}&z=14`;

export default function HomePage() {
  return (
    <div className="container-page space-y-12 py-5 sm:space-y-16 sm:py-8">
      <HeroCarousel />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <li key={benefit.title} className="card flex items-start gap-3 p-4">
            <span className="bg-mint text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
              <Icon name={benefit.icon} />
            </span>
            <span>
              <span className="block text-sm font-bold">{benefit.title}</span>
              <span className="text-muted block text-xs">{benefit.text}</span>
            </span>
          </li>
        ))}
      </ul>

      <section>
        <SectionTitle title="Каталог" href="/catalog" linkLabel="Все рубрики" />
        <Suspense fallback={<div className="skeleton h-48 w-full" />}>
          <CategoryTiles />
        </Suspense>
      </section>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <CollectionsShowcase />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <PopularProducts />
      </Suspense>

      <section
        id="about"
        className="card grid scroll-mt-40 overflow-hidden md:grid-cols-[1fr_20rem]"
      >
        <div className="space-y-4 p-6 sm:p-10">
          <h2 className="text-3xl sm:text-4xl">О нас</h2>
          <p className="leading-relaxed">
            {company.name} — поставщик тканей и производитель текстильных изделий. С {company.since}{" "}
            года мы продаём ткани оптом и в розницу и шьём шторы, покрывала и декоративные подушки.
          </p>
          <p className="text-muted leading-relaxed">
            В каталоге — ткани из натуральных и синтетических волокон, шёлк, вуаль, а также кисти,
            шнуры и тесьма для отделки. Разные фактуры, цвета и плотности — чтобы собрать интерьер
            целиком в одном месте.
          </p>
          <a href={company.phoneHref} className="btn-primary">
            <Icon name="phone" /> Позвонить {company.phone}
          </a>
        </div>
        <div className="bg-primary flex items-center justify-center p-8">
          <img src={asset("/logo.png")} alt="Логотип Augusta House" width={240} height={240} />
        </div>
      </section>

      <section id="faq" className="scroll-mt-40">
        <div className="text-center">
          <SectionTitle title="Частые вопросы" />
        </div>
        <Faq />
      </section>

      <section
        id="contacts"
        className="card grid scroll-mt-40 overflow-hidden lg:grid-cols-[22rem_1fr]"
      >
        <div className="space-y-4 p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl">Контакты</h2>
          <p className="flex items-start gap-2.5 text-sm">
            <Icon name="pin" className="text-primary mt-0.5 size-5 shrink-0" />
            Россия, {company.address}
          </p>
          <p className="flex items-center gap-2.5 text-sm font-bold">
            <Icon name="phone" className="text-primary size-5" />
            <a href={company.phoneHref}>{company.phone}</a>
          </p>
          <p className="text-muted text-sm">
            Самовывоз заказов и просмотр образцов — по предварительной договорённости.
          </p>
          <a href={company.phoneHref} className="btn-outline">
            Позвонить
          </a>
        </div>
        <iframe
          src={mapUrl}
          title="Augusta House на карте"
          loading="lazy"
          className="bg-mint h-72 w-full border-0 lg:h-full lg:min-h-80"
        />
      </section>
    </div>
  );
}
