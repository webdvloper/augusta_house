import { api } from "@/lib/api";
import { company } from "@/lib/format";

import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

/** Баннер главной: приветствие и подборки с отметкой «На главной» из админки. */
export async function Hero() {
  const collections = await api.collections(3, true).catch(() => []);
  const featured = collections.filter((collection) => collection.product_count > 0).slice(0, 4);
  const firstPhotos = featured.flatMap((collection) =>
    collection.preview.map((product) => product.image).filter(Boolean),
  ) as string[];

  const slides: HeroSlide[] = [
    {
      key: "welcome",
      eyebrow: `Интерьерный текстиль с ${company.since} года`,
      title: "Ткани, которые создают дом",
      text: "Портьерные ткани, вуаль и натуральный шёлк — метражом и в готовых шторах.",
      cta: "Перейти в каталог",
      href: "/catalog",
      image: firstPhotos[0] ?? null,
      thumbs: firstPhotos.slice(1, 3),
    },
    ...featured.map((collection) => ({
      key: collection.slug,
      eyebrow: "Подборка",
      title: collection.name,
      text: collection.description || "Готовое сочетание тканей и декора от Augusta House.",
      cta: "Смотреть подборку",
      href: `/collections/${collection.slug}`,
      image: collection.image,
      thumbs: collection.preview
        .map((product) => product.image)
        .filter((src): src is string => !!src && src !== collection.image)
        .slice(0, 2),
    })),
  ];

  return <HeroCarousel slides={slides} />;
}
