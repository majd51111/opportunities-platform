import Link from "next/link";

import { routes } from "@/config/routes";

const adminNav = [
  { href: routes.admin.dashboard, label: "Overview" },
  { href: routes.admin.opportunities, label: "Opportunities" },
  { href: routes.admin.users, label: "Users" },
  { href: routes.admin.reports, label: "Reports" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Admin
        </p>
        <nav className="flex flex-col gap-2">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
