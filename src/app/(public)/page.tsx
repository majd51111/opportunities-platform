import Link from "next/link";

import { routes } from "@/config/routes";

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Foundation
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Opportunities Platform
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Production-ready Next.js scaffold for browsing opportunities, managing
          profiles, saving favorites, searching with filters, and running admin
          reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: routes.public.opportunities, label: "Opportunities" },
          { href: routes.public.search, label: "Search" },
          { href: routes.platform.favorites, label: "Favorites" },
          { href: routes.platform.profile, label: "Profile" },
          { href: routes.platform.reports, label: "Reports" },
          { href: routes.admin.dashboard, label: "Admin" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-zinc-200 p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
