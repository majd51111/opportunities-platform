"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { routes } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";



export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t, dir, language } = useLanguage();
  const adminLabels = {
    ar: { support: "فريق الدعم", requests: "طلبات الدعم", brand: "بوابة الفرص" },
    en: { support: "Support team", requests: "Support requests", brand: "Opportunity Gateway" },
    es: { support: "Equipo de soporte", requests: "Solicitudes de soporte", brand: "Portal de Oportunidades" },
    fr: { support: "Équipe support", requests: "Demandes de support", brand: "Portail des opportunités" },
    de: { support: "Support-Team", requests: "Supportanfragen", brand: "Chancenportal" },
    pt: { support: "Equipe de suporte", requests: "Solicitações de suporte", brand: "Portal de Oportunidades" },
    ja: { support: "サポートチーム", requests: "サポート依頼", brand: "機会のポータル" },
    zh: { support: "支持团队", requests: "支持请求", brand: "机会门户" },
  }[language];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "support" | null>(null);
  const [permissions, setPermissions] = useState({ canReviewOpportunities: false, canManageReports: false, canManageSupportRequests: false });

  useEffect(() => {
    async function loadAccess() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(routes.auth.login); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (!roleData || !["admin", "support"].includes(roleData.role)) { router.replace(routes.public.home); return; }
      const currentRole = roleData.role as "admin" | "support";
      if (currentRole === "support") {
        const { data: permissionData } = await supabase.from("support_permissions").select("can_review_opportunities, can_manage_reports, can_manage_support_requests").eq("user_id", user.id).maybeSingle();
        const nextPermissions = { canReviewOpportunities: permissionData?.can_review_opportunities ?? false, canManageReports: permissionData?.can_manage_reports ?? false, canManageSupportRequests: permissionData?.can_manage_support_requests ?? false };
        if (!nextPermissions.canReviewOpportunities && !nextPermissions.canManageReports && !nextPermissions.canManageSupportRequests) { router.replace(routes.public.home); return; }
        setPermissions(nextPermissions);
      }
      setRole(currentRole); setLoading(false);
    }

    void loadAccess();
  }, [router]);

  const adminNav = [
    ...(role === "admin" ? [{ href: routes.admin.dashboard, label: t.common.overview }] : []),
    ...(role === "admin" || permissions.canReviewOpportunities ? [{ href: routes.admin.opportunities, label: t.common.opportunities }] : []),
    ...(role === "admin" ? [{ href: routes.admin.users, label: t.common.users }, { href: routes.admin.support, label: adminLabels.support }] : []),
    ...(role === "admin" || permissions.canManageSupportRequests ? [{ href: routes.admin.supportRequests, label: adminLabels.requests }] : []),
    ...(role === "admin" || permissions.canManageReports ? [{ href: routes.admin.reports, label: t.common.reports }] : []),
  ];
  if (loading || !role) return <main className="min-h-screen" dir={dir} />;

  return (
    <div className="flex min-h-screen" dir={dir}>
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <Link href={routes.public.opportunities} className="mb-8 flex items-center gap-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <img src="/new-logo.png" alt="" className="h-12 w-12 rounded-full border border-blue-100 bg-white object-contain shadow-[0_4px_12px_rgba(37,99,235,0.18)] ring-2 ring-blue-50" />
          <span>{adminLabels.brand}</span>
        </Link>
        <p className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {t.common.admin}
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
          <Link
            href={routes.public.opportunities}
            className="mt-4 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-[#6c5cf5] hover:bg-[#f0efff] hover:text-[#4c3ecb]"
          >
            {t.common.backToHome}
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <nav className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 md:hidden" aria-label={t.common.admin}>
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-0 rounded-md px-2 py-3 text-center text-sm font-medium leading-5 text-zinc-700 transition hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={routes.public.opportunities}
            className="col-span-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:border-[#6c5cf5] hover:bg-[#f0efff] hover:text-[#4c3ecb]"
          >
            {t.common.backToHome}
          </Link>
        </nav>
        {children}
      </main>
    </div>
  );
}
