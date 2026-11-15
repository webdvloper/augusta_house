/**
 * Режим сборки. Обычный — витрина ходит в Django API.
 * Статичный (NEXT_PUBLIC_STATIC_DEMO=1) — демо для GitHub Pages: каталог берётся
 * из снимка demo-catalog.json, заказы не отправляются на сервер.
 */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

/** Подкаталог сайта, например "/augusta_house" на GitHub Pages. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Путь к файлу из public/ — для <img>, которым Next не добавляет basePath сам. */
export const asset = (path: string) => `${BASE_PATH}${path}`;

/** Адрес страницы для <form action> (в <Link> basePath подставляется автоматически). */
export const route = (path: string) =>
  `${BASE_PATH}${path}${IS_STATIC && !path.endsWith("/") ? "/" : ""}`;
