"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "./Icon";

export interface HeroSlide {
  key: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image: string | null;
  /** Миниатюры товаров подборки — коллаж справа. */
  thumbs: string[];
}

const TONES = [
  "from-primary to-primary-dark text-white",
  "from-[#f3e3c8] to-[#e4c29c] text-text",
  "from-mint to-[#bfe3df] text-text",
  "from-[#ece6f2] to-[#d7cde3] text-text",
];

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  const go = (step: number) => setIndex((index + step + count) % count);

  return (
    <section
      aria-roledescription="карусель"
      aria-label="Акции и подборки"
      className="shadow-card relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, position) => {
          const dark = position % TONES.length === 0;
          const pictures = [slide.image, ...slide.thumbs].filter(Boolean).slice(0, 3) as string[];
          return (
            <div
              key={slide.key}
              aria-hidden={position !== index}
              inert={position !== index}
              className={`relative grid w-full shrink-0 bg-gradient-to-br md:grid-cols-[1.1fr_1fr] ${TONES[position % TONES.length]}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_right,transparent,black)] opacity-[0.12] [background:repeating-linear-gradient(100deg,transparent_0_38px,currentColor_38px_40px)]"
              />
              <div className="relative flex min-h-72 flex-col items-start justify-center gap-3 px-6 pt-10 pb-14 sm:min-h-96 sm:px-14">
                <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">
                  {slide.eyebrow}
                </p>
                <h2 className="text-4xl leading-[0.95] text-balance sm:text-6xl">{slide.title}</h2>
                <p className="max-w-md text-sm opacity-90 sm:text-base">{slide.text}</p>
                <Link href={slide.href} className={`${dark ? "btn-accent" : "btn-primary"} mt-2`}>
                  {slide.cta} <Icon name="arrow" className="size-4" />
                </Link>
              </div>

              {pictures.length > 0 && (
                <div className="relative hidden items-center justify-center p-8 md:flex">
                  {pictures.map((src, order) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      loading={position === 0 ? "eager" : "lazy"}
                      className={`absolute rounded-2xl border-4 border-white/80 object-cover shadow-xl ${
                        [
                          "z-20 size-60 rotate-2 lg:size-72",
                          "z-10 size-40 -translate-x-40 translate-y-16 -rotate-6 lg:size-48 lg:-translate-x-48",
                          "size-36 translate-x-40 -translate-y-20 rotate-6 lg:size-44 lg:translate-x-48",
                        ][order]
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          {[-1, 1].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => go(step)}
              aria-label={step < 0 ? "Предыдущий слайд" : "Следующий слайд"}
              className={`text-primary absolute top-1/2 z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow backdrop-blur transition hover:scale-105 hover:bg-white sm:flex ${
                step < 0 ? "left-3" : "right-3"
              }`}
            >
              <Icon name="chevron" className={`size-5 ${step < 0 ? "rotate-180" : ""}`} />
            </button>
          ))}

          <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2">
            {slides.map((slide, position) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Слайд ${position + 1}: ${slide.title}`}
                aria-current={position === index}
                className={`h-2 rounded-full shadow-sm transition-all ${
                  position === index ? "bg-secondary w-7" : "w-2 bg-white/80 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
