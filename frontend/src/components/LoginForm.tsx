"use client";

import { useState } from "react";

/** Заглушка входа: регистрация покупателя появится после прототипа (FR-11). */
export function LoginForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      className="card mx-auto max-w-md space-y-4 p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h1 className="text-3xl">Войдите в аккаунт</h1>
      <label className="block space-y-1.5 text-sm">
        <span className="font-semibold">Почта или телефон</span>
        <input required name="login" autoComplete="username" className="input" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked className="accent-primary size-4" /> Запомнить меня
      </label>
      <button type="submit" className="btn-primary w-full py-3">
        Далее
      </button>
      {sent && (
        <p role="status" className="bg-mint rounded-lg p-3 text-sm">
          Личный кабинет ещё в разработке. Оформить заказ можно без регистрации — корзина и
          избранное сохраняются в вашем браузере.
        </p>
      )}
      <p className="text-muted text-xs">
        Регистрация покупателей появится в следующей версии сайта.
      </p>
    </form>
  );
}
