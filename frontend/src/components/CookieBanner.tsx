"use client";

import { useSyncExternalStore } from "react";

const KEY = "ah:cookies";
const EVENT = "ah:cookies";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function isAccepted() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function CookieBanner() {
  const accepted = useSyncExternalStore(subscribe, isAccepted, () => true);
  if (accepted) return null;

  return (
    <div className="card fixed inset-x-3 bottom-[4.75rem] z-50 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 p-4 text-sm md:bottom-4">
      <p className="min-w-56 flex-1">
        Мы храним корзину и избранное в вашем браузере. Оставаясь на сайте, вы соглашаетесь с
        использованием локального хранилища.
      </p>
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            /* хранилище недоступно */
          }
          window.dispatchEvent(new Event(EVENT));
        }}
      >
        Принять
      </button>
    </div>
  );
}
