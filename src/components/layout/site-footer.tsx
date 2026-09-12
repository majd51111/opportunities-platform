"use client";

import { siteConfig } from "@/config/site";
import { useLanguage } from "@/providers/app-providers";

export function SiteFooter() {
  const { dir, t } = useLanguage();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800" dir={dir}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
        <p>{siteConfig.name}</p>
        <p>{t.home.label}</p>
      </div>
    </footer>
  );
}
