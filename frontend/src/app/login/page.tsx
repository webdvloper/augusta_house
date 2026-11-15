import type { Metadata } from "next";

import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <LoginForm />
    </div>
  );
}
