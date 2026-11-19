import { existsSync } from "node:fs";

import type { NextConfig } from "next";

// Статичная версия для GitHub Pages: NEXT_PUBLIC_STATIC_DEMO=1 npm run build → out/
const isStatic = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

// Снимок каталога из базы Django (backend: python manage.py export_static).
// Он генерируется при сборке и не хранится в git; обычной сборке он не нужен.
const snapshot = isStatic ? "./src/generated/catalog.json" : "./src/lib/empty-catalog.json";

if (isStatic && !existsSync(snapshot)) {
  throw new Error(
    "Нет снимка каталога src/generated/catalog.json. Выполните в backend/: python manage.py export_static",
  );
}

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export",
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  turbopack: {
    resolveAlias: { "@catalog-snapshot": snapshot },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
