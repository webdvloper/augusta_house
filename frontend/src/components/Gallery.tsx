"use client";

import { useState } from "react";

import type { ProductPhoto } from "@/lib/types";

export function Gallery({ photos, name }: { photos: ProductPhoto[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!current) {
    return (
      <div className="card text-muted flex aspect-square items-center justify-center text-sm">
        Фото скоро появится
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {photos.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:flex-col">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Фото ${index + 1}`}
              aria-current={index === active}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 sm:size-20 ${
                index === active ? "border-primary" : "border-transparent opacity-70"
              }`}
            >
              <img src={photo.image} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="card flex-1 self-start overflow-hidden">
        <img src={current.image} alt={name} className="aspect-square w-full object-cover" />
      </div>
    </div>
  );
}
