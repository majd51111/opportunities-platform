import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
        <p>{siteConfig.name}</p>
        <p>Foundation scaffold</p>
      </div>
    </footer>
  );
}
