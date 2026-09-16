"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import type { Opportunity } from "@/types";
import type { LanguageCode } from "@/languages";
import { getLocalizedText, normalizeOpportunityCategory, localizeDevice, localizeVerification, getOpportunityStartUrl } from "@/types";

const newBadgeLabels: Record<LanguageCode, string> = {
  ar: "جديد",
  en: "New",
  es: "Nuevo",
  fr: "Nouveau",
  de: "Neu",
  pt: "Novo",
  ja: "新着",
  zh: "新品",
};

const NEW_BADGE_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

function getOpportunityLogoUrl(opportunityUrl: string | null | undefined): string | null {
  if (!opportunityUrl) return null;

  try {
    const hostname = new URL(opportunityUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return null;
  }
}

export default function OpportunitiesPage() {
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const languageKey = String(language).split("-")[0].toLowerCase() as LanguageCode;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    async function loadOpportunities() {
      setLoading(true);
      setError("");
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
        setCanDelete(role?.role === "admin");
      } else {
        setCanDelete(false);
      }

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, created_at, title, slug, short_description, description, status, verification_status, earnings_text, countries, devices, image_url, direct_url, category_id"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });
        const { data: translations, error: translationsError } = await supabase
  .from("opportunity_translations")
  .select(
    "opportunity_id, language_code, title, short_description, description, earnings_text"
  );
      if (error || translationsError) {
  const queryError = error ?? translationsError;
  if (queryError) {
    console.error("Failed to load opportunities", {
      message: queryError.message,
      code: queryError.code,
      details: queryError.details,
      hint: queryError.hint,
    });
  }
  setError(t.opportunitiesPage.loadError);
  setLoading(false);
  return;
}

      const translationsByOpportunity = new Map<
  string,
  Record<string, Record<string, unknown>>
>();

for (const translation of translations ?? []) {
  const opportunityId = String(translation.opportunity_id);

  if (!translationsByOpportunity.has(opportunityId)) {
    translationsByOpportunity.set(opportunityId, {});
  }
  const langKey = String(translation.language_code ?? "").split("-")[0].toLowerCase();
  translationsByOpportunity.get(opportunityId)![langKey] = {
    title: translation.title,
    short_description: translation.short_description,
    description: translation.description,
    earnings_text: translation.earnings_text,
  };
}

const localizedOpportunities = (data ?? []).map((opportunity) => {
const localized =
  translationsByOpportunity.get(String(opportunity.id))?.[languageKey] ??
  translationsByOpportunity.get(String(opportunity.id))?.["en"];
  return {
    ...opportunity,
    title: localized?.title ?? opportunity.title,
short_description:
  localized?.short_description || localized?.description || opportunity.short_description,
description: localized?.description ?? opportunity.description,
earnings_text: localized?.earnings_text ?? opportunity.earnings_text,
  };
});

setOpportunities(localizedOpportunities);
      setLoading(false);
    }

    loadOpportunities();
  }, [t.opportunitiesPage.loadError, language]);

  async function recordOpportunityStart(opportunityId: string | number, url: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase.from("opportunity_events").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      event_type: "started",
      metadata: { url },
    });
    if (error) {
      console.error("Failed to record opportunity click", error);
      return false;
    }
    return true;
  }

  async function requireLogin(): Promise<boolean> {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    if (user) return true;
    router.push("/login");
    return false;
  }

  async function deleteOpportunity(opportunityId: string | number) {
    if (!window.confirm(t.common.deleteOpportunity)) return;
    const { error: deleteError } = await getSupabaseBrowserClient().rpc("delete_opportunity_as_admin", { p_opportunity_id: String(opportunityId) });
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setOpportunities((current) => current.filter((item) => item.id !== opportunityId));
  }
  if (loading) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold">{t.opportunitiesPage.title}</h1>
        <p className="mt-4 text-zinc-500">{t.opportunitiesPage.loading}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold">{t.opportunitiesPage.title}</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.opportunitiesPage.title}</h1>
            <p className="mt-2 text-zinc-500">{t.opportunitiesPage.discover}</p>
          </div>
          <Link href="/submit-opportunity" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">
            {dir === "rtl" ? "إضافة فرصة" : "Add opportunity"}
          </Link>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-zinc-500">{t.opportunitiesPage.noPublished}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opportunity) => {
            const category = normalizeOpportunityCategory(opportunity.category, languageKey);
            const title = getLocalizedText(opportunity.title, languageKey, "en") ?? "Opportunity";
            const summary =
              getLocalizedText(opportunity.short_description ?? opportunity.description, languageKey, "en") ??
              t.opportunitiesPage.noDescription;
const deviceList =
  (localizeDevice(opportunity.devices, languageKey) ?? "");

            

  const localizedEarnings =
  getLocalizedText(
    opportunity.earnings_text,
    languageKey,
    "en"
  ) || opportunity.earnings_text;

const localizedVerification = localizeVerification(opportunity.verification_status, languageKey) ?? opportunity.verification_status;
            const startUrl = getOpportunityStartUrl(opportunity) ?? opportunity.direct_url ?? opportunity.source_url;
            const createdAt = opportunity.created_at ? Date.parse(opportunity.created_at) : Number.NaN;
            const isNew = Number.isFinite(createdAt) && Date.now() - createdAt >= 0 && Date.now() - createdAt < NEW_BADGE_DURATION_MS;
            const logoUrl = getOpportunityLogoUrl(startUrl);
            
            return (
              <article
                key={opportunity.id}
                className={`relative isolate flex h-full flex-col overflow-hidden rounded-2xl border p-6 shadow-[0_12px_28px_rgba(76,112,160,0.12)] transition-transform duration-200 hover:-translate-y-1 [&>*:not(.pointer-events-none)]:relative [&>*:not(.pointer-events-none)]:z-10 ${[
                  "border-[#f5d7ae]",
                  "border-[#b9e8d5]",
                  "border-[#d8c8fa]",
                  "border-[#bddafa]",
                  "border-[#f2c4df]",
                ][Math.abs(Number(opportunity.id) || String(opportunity.id).split("").reduce((total, character) => total + character.charCodeAt(0), 0)) % 5]}`}
                style={{
                  backgroundImage: [
                    "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.96) 0 18%, transparent 52%), radial-gradient(ellipse at 0% 100%, rgba(255,222,177,.78) 0 16%, transparent 48%), linear-gradient(135deg, #fffdfa 0%, #fff7ed 48%, #fce8c8 100%)",
                    "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.98) 0 18%, transparent 52%), radial-gradient(ellipse at 0% 100%, rgba(173,235,208,.72) 0 16%, transparent 48%), linear-gradient(135deg, #fcfffd 0%, #effcf6 48%, #d9f5e8 100%)",
                    "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.98) 0 18%, transparent 52%), radial-gradient(ellipse at 0% 100%, rgba(205,187,255,.7) 0 16%, transparent 48%), linear-gradient(135deg, #fffefe 0%, #f8f3ff 48%, #e8ddff 100%)",
                    "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.98) 0 18%, transparent 52%), radial-gradient(ellipse at 0% 100%, rgba(161,205,255,.7) 0 16%, transparent 48%), linear-gradient(135deg, #fdffff 0%, #f1f8ff 48%, #dceeff 100%)",
                    "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,.98) 0 18%, transparent 52%), radial-gradient(ellipse at 0% 100%, rgba(246,181,220,.68) 0 16%, transparent 48%), linear-gradient(135deg, #fffdfd 0%, #fff3fa 48%, #f9dced 100%)",
                  ][Math.abs(Number(opportunity.id) || String(opportunity.id).split("").reduce((total, character) => total + character.charCodeAt(0), 0)) % 5],
                }}
              >
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-44 w-72 rounded-[50%] border-[24px] border-white/30" />
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/new-logo.png";
                    }}
                    className="pointer-events-none absolute start-4 top-3 z-20 h-20 w-20 rounded-2xl border border-white/80 bg-white p-3 object-contain shadow-md"
                  />
                )}
                {isNew && (
                  <span className="pointer-events-none absolute end-4 top-4 z-20 animate-[new-badge-shine_1.8s_ease-in-out_infinite] px-3 py-1 text-sm font-extrabold text-[#b77900] [text-shadow:0_1px_0_#fff7bf,0_0_8px_rgba(251,191,36,0.9)]">
                    {newBadgeLabels[languageKey]}
                  </span>
                )}
                {opportunity.image_url && (
                  <img
                    src={opportunity.image_url}
                    alt={title}
                    className="mb-4 h-48 w-full rounded-xl object-cover"
                  />
                )}

                <h2 className="min-h-32 pt-24 text-xl font-semibold leading-7">{title}</h2>
                {category && (
                  <p className="mt-1 text-sm text-zinc-500">{category.name}</p>
                )}
                <div className="mt-auto flex flex-wrap gap-3 pt-5">
                  {startUrl && (
                    <a
                      href={startUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={async (event) => {
                        event.preventDefault();
                        if (!await requireLogin()) return;
                        if (await recordOpportunityStart(opportunity.id, startUrl)) {
                          window.open(startUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white"
                    >
                      {t.opportunitiesPage.startOpportunity}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (await requireLogin()) router.push(`/opportunities/${opportunity.id}`);
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-[#6c5cf5] hover:bg-[#f0efff] hover:text-[#4c3ecb]"
                  >
                    {t.opportunitiesPage.viewOpportunity}
                  </button>
                </div>

                <p className="mt-2 text-zinc-600">{summary}</p>
                {localizedEarnings && (
                  <p className="mt-4 font-medium">
                    {t.opportunitiesPage.earnings}: {localizedEarnings}
                  </p>
                )}

                {deviceList && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {t.opportunitiesPage.devices}: {deviceList}
                  </p>
                )}

                {localizedVerification && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {t.opportunitiesPage.verification}: {localizedVerification}
                  </p>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => void deleteOpportunity(opportunity.id)}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    {t.common.deleteOpportunity}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}