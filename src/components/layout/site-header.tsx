import Link from "next/link";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const navItems = [
  { href: routes.public.opportunities, label: "Opportunities" },
  { href: routes.public.search, label: "Search" },
  { href: routes.platform.favorites, label: "Favorites" },
  { href: routes.platform.profile, label: "Profile" },
  { href: routes.admin.dashboard, label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={routes.public.home} className="text-sm font-semibold tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href={routes.auth.login}
            className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
