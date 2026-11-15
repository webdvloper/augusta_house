"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "./Icon";

const slides = [
  {
    eyebrow: "Интерьерный текстиль с 2001 года",
    title: "Ткани, которые создают дом",
    text: "Портьерные ткани, вуаль и натуральный шёлк — метражом и в готовых шторах.",
    cta: "Перейти в каталог",
    href: "/catalog",
    tone: "from-primary to-primary-dark text-white",
    button: "btn-accent",
  },
  {
    eyebrow: "Подборка",
    title: "Золото и терракота",
    text: "Тёплая гамма для гостиной: портьеры, подхваты с кистями и декоративные подушки.",
    cta: "Смотреть подборку",
    href: "/collections/zoloto-i-terrakota",
    tone: "from-[#f3e3c8] to-[#e7c9a4] text-text",
    button: "btn-primary",
  },
  {
    eyebrow: "Распродажа",
    title: "Последние метры — до −20%",
    text: "Остатки рулонов и комплекты прошлых коллекций по сниженным ценам.",
    cta: "Успеть купить",
    href: "/collections/rasprodazha",
    tone: "from-mint to-[#bfe3df] text-text",
    button: "btn-primary",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (step: number) => setIndex((index + step + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="карусель"
      aria-label="Акции и подборки"
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, position) => (
          <div
            key={slide.title}
            aria-hidden={position !== index}
            inert={position !== index}
            className={`relative w-full shrink-0 bg-gradient-to-br ${slide.tone}`}
          >
            {/* Декоративные «складки ткани» */}
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_left,black,transparent)] opacity-25 [background:repeating-linear-gradient(100deg,transparent_0_38px,currentColor_38px_40px)]"
            />
            <div className="relative flex min-h-64 max-w-2xl flex-col items-start justify-center gap-3 px-6 py-10 sm:min-h-80 sm:px-14">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">
                {slide.eyebrow}
              </p>
              <h2 className="text-4xl leading-none sm:text-6xl">{slide.title}</h2>
              <p className="max-w-md text-sm opacity-90 sm:text-base">{slide.text}</p>
              <Link href={slide.href} className={`${slide.button} mt-2`}>
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {[-1, 1].map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => go(step)}
          aria-label={step < 0 ? "Предыдущий слайд" : "Следующий слайд"}
          className={`text-primary absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow hover:bg-white sm:flex ${
            step < 0 ? "left-3" : "right-3"
          }`}
        >
          <Icon name="chevron" className={`size-5 ${step < 0 ? "rotate-180" : ""}`} />
        </button>
      ))}

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {slides.map((slide, position) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setIndex(position)}
            aria-label={`Слайд ${position + 1}`}
            aria-current={position === index}
            className={`h-2 rounded-full transition-all ${
              position === index ? "bg-secondary w-6" : "w-2 bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
