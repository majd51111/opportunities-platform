"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { routes } from "@/config/routes";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { useLanguage } from "@/providers/app-providers";

export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { t, dir, language } = useLanguage();
  const navigationLabels = {
    ar: { support: "الدعم والمساعدة", about: "من نحن", brand: "بوابة الفرص" },
    en: { support: "Support & Help", about: "About us", brand: "Opportunity Gateway" },
    es: { support: "Soporte y ayuda", about: "Sobre nosotros", brand: "Portal de Oportunidades" },
    fr: { support: "Support et aide", about: "À propos", brand: "Portail des opportunités" },
    de: { support: "Support & Hilfe", about: "Über uns", brand: "Chancenportal" },
    pt: { support: "Suporte e ajuda", about: "Sobre nós", brand: "Portal de Oportunidades" },
    ja: { support: "サポート", about: "私たちについて", brand: "機会のポータル" },
    zh: { support: "支持与帮助", about: "关于我们", brand: "机会门户" },
  }[language];

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function loadAvatar(currentUser: User | null) {
      const avatarPath = currentUser?.user_metadata?.avatar_path;
      if (!avatarPath) {
        setAvatarUrl("");
        return;
      }

      const { data } = await supabase.storage.from("avatars").createSignedUrl(avatarPath, 3600);
      setAvatarUrl(data?.signedUrl ?? "");
    }

    async function loadUserAccess() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser);
      await loadAvatar(currentUser);

      if (!currentUser) {
        setCanAccessAdmin(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("status")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileData?.status === "suspended" || profileData?.status === "banned") {
        await supabase.auth.signOut();
        setUser(null);
        setCanAccessAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      setCanAccessAdmin(roleData?.role === "admin" || roleData?.role === "support");
    }

    void loadUserAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      void loadAvatar(currentUser);
      if (!currentUser) {
        setAvatarUrl("");
        setCanAccessAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function closeAccountMenu(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeAccountMenu);
    return () => document.removeEventListener("mousedown", closeAccountMenu);
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();

    await supabase.auth.signOut();
    setUser(null);
    setAccountMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      href: routes.public.opportunities,
      label: t.common.opportunities,
    },
    {
      href: routes.public.search,
      label: t.common.search,
    },
    {
      href: routes.public.support,
      label: navigationLabels.support,
    },
    {
      href: routes.public.about,
      label: navigationLabels.about,
    },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800" dir={dir}>
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={routes.public.home}
          className="flex min-w-0 items-center gap-2.5 text-sm font-semibold tracking-tight"
          aria-label={navigationLabels.brand}
        >
          <img
            src="/new-logo.png"
            alt=""
            className="h-12 w-12 rounded-full border border-blue-100 bg-white object-contain shadow-[0_4px_12px_rgba(37,99,235,0.18)] ring-2 ring-blue-50"
          />
          <span className="truncate">{navigationLabels.brand}</span>
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

        <nav className="order-3 flex w-full min-w-0 items-center justify-center gap-3 border-t border-zinc-100 pt-3 md:hidden" aria-label="Primary navigation">
          {navItems.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-center text-xs font-medium text-zinc-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSelector />

          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-label={t.common.profile}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition hover:border-[#6c5cf5] hover:text-[#4c3ecb]"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>}
              </button>
              {accountMenuOpen && (
                <div role="menu" className="absolute top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg rtl:left-0 ltr:right-0">
                  <Link href={routes.platform.profile} role="menuitem" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 transition hover:bg-[#f0efff] hover:text-[#4c3ecb]">
                    {t.common.profile}
                  </Link>
                  {canAccessAdmin && (
                    <Link href={routes.admin.dashboard} role="menuitem" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm text-zinc-700 transition hover:bg-[#f0efff] hover:text-[#4c3ecb]">
                      {t.common.admin}
                    </Link>
                  )}
                  <button type="button" role="menuitem" onClick={handleSignOut} className="w-full px-4 py-2 text-start text-sm text-zinc-700 transition hover:bg-[#f0efff] hover:text-[#4c3ecb]">
                    {t.common.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={routes.auth.login}
              className="text-sm text-zinc-600 transition hover:text-zinc-900"
            >
              {t.common.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}