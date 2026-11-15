import Link from "next/link";

import { EmptyState } from "@/components/Ui";

export default function NotFound() {
  return (
    <div className="container-page py-12">
      <EmptyState
        title="Страница не найдена"
        text="Возможно, товар сняли с продажи или ссылка устарела."
        action={
          <Link href="/catalog" className="btn-primary">
            Перейти в каталог
          </Link>
        }
      />
    </div>
  );
}
