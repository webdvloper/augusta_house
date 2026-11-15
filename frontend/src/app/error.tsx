"use client";

import { EmptyState } from "@/components/Ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-12">
      <EmptyState
        title="Что-то пошло не так"
        text={
          error.name === "ApiError"
            ? error.message
            : "Не удалось загрузить страницу. Проверьте, что сервер магазина запущен."
        }
        action={
          <button type="button" className="btn-primary" onClick={reset}>
            Попробовать снова
          </button>
        }
      />
    </div>
  );
}
