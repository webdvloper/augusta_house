import type { Metadata } from "next";

import { FavoritesView } from "@/components/FavoritesView";
import { Breadcrumbs } from "@/components/Ui";

export const metadata: Metadata = { title: "Избранное" };

export default function FavoritesPage() {
  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ name: "Избранное" }]} />
      <h1 className="mb-5 text-4xl sm:text-5xl">Избранное</h1>
      <FavoritesView />
    </div>
  );
}
