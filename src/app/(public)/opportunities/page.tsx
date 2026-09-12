"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import type { Opportunity } from "@/types";
import type { LanguageCode } from "@/languages";
import { getLocalizedText, normalizeOpportunityCategory, localizeDevice, localizeVerification, getOpportunityStartUrl } from "@/types";
export default function OpportunitiesPage() {
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const languageKey = String(language).split("-")[0].toLowerCase() as LanguageCode;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOpportunities() {
      setLoading(true);
      setError("");
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, title, slug, short_description, description, status, verification_status, earnings_text, countries, devices, image_url, direct_url, category_id"
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
  localized?.short_description ?? opportunity.short_description,
description: localized?.description ?? opportunity.description,
earnings_text: localized?.earnings_text ?? opportunity.earnings_text,
  };
});

setOpportunities(localizedOpportunities);
      setLoading(false);
    }

    loadOpportunities();
  }, [t.opportunitiesPage.loadError, language]);

  async function recordOpportunityStart(opportunityId: string | number) {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("opportunity_events").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      event_type: "started",
    });
  }

  async function requireLogin(): Promise<boolean> {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    if (user) return true;
    router.push("/login");
    return false;
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
          {opportunities.map((opportunity, index) => {
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
            
            return (
              <article
                key={opportunity.id}
                className={`flex h-full flex-col rounded-2xl border p-6 shadow-sm ${[
                  "border-orange-100 bg-[linear-gradient(145deg,#fffdf9_0%,#fff5e8_100%)]",
                  "border-emerald-100 bg-[linear-gradient(145deg,#fbfffd_0%,#e9fbf3_100%)]",
                  "border-violet-100 bg-[linear-gradient(145deg,#fefcff_0%,#f2edff_100%)]",
                  "border-sky-100 bg-[linear-gradient(145deg,#fcfeff_0%,#eaf5ff_100%)]",
                  "border-pink-100 bg-[linear-gradient(145deg,#fffafd_0%,#fff0f8_100%)]",
                ][index % 5]}`}
              >
                {opportunity.image_url && (
                  <img
                    src={opportunity.image_url}
                    alt={title}
                    className="mb-4 h-48 w-full rounded-xl object-cover"
                  />
                )}

                <h2 className="text-xl font-semibold">{title}</h2>
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
                        void recordOpportunityStart(opportunity.id);
                        window.open(startUrl, "_blank", "noopener,noreferrer");
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
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}