import type { NextConfig } from "next";

// Статичная демо-версия для GitHub Pages: NEXT_PUBLIC_STATIC_DEMO=1 npm run build → out/
const isStatic = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

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
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
