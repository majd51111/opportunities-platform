"use client";

import { useLanguage } from "@/providers/app-providers";

export default function AdminDashboardPage() {
  const { dir, t } = useLanguage();

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16" dir={dir}>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {t.common.admin}
      </h1>

      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        {t.common.overview}
      </p>
    </section>
  );
}