import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Augusta House — ткани, шторы и интерьерный декор",
    template: "%s — Augusta House",
  },
  description:
    "Интернет-магазин домашнего текстиля Augusta House: портьерные ткани, вуаль, шёлк, готовые шторы, подхваты, шнуры, тесьма и декоративные подушки.",
};

export const viewport: Viewport = { themeColor: "#035567" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <CookieBanner />
      </body>
    </html>
  );
}
