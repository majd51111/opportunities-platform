"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import type { LanguageCode } from "@/languages";
import type { Opportunity } from "@/types";
import { getLocalizedText, getOpportunityStartUrl, joinLocalizedOpportunityList, localizeCountry, localizePaymentMethod, localizeRequirement, normalizeOpportunityCategory, localizeDevice, localizeVerification, isVerifiedOpportunity } from "@/types";

export default function OpportunityDetailsPage() {
  const { t, dir, language } = useLanguage();
  const languageKey = String(language).split("-")[0].toLowerCase() as LanguageCode;
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);


  useEffect(() => {
    async function loadOpportunity() {
      setLoading(true);
      setError("");
      setOpportunity(null);
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      const canReviewPending = roleData?.role === "admin" || roleData?.role === "support";

      const numericId = /^\d+$/.test(slug) ? Number(slug) : null;
      let opportunityQuery = supabase
        .from("opportunities")
        .select(
          "id, title, slug, short_description, description, status, verification_status, earnings_text, countries, devices, payment_methods, requirements, image_url, direct_url, category_id, category:categories(id, name)"
        )
        .in("status", canReviewPending ? ["pending", "published"] : ["published"]);

      opportunityQuery = numericId === null
        ? opportunityQuery.eq("slug", slug)
        : opportunityQuery.or(`slug.eq.${slug},id.eq.${numericId}`);

      let { data, error } = await opportunityQuery.maybeSingle();

      // Older links may contain a numeric prefix before the generated slug suffix.
      if (!data && !error) {
        const prefixedId = slug.match(/^(\d+)-/);
        if (prefixedId) {
          const fallback = await supabase
            .from("opportunities")
            .select(
              "id, title, slug, short_description, description, status, verification_status, earnings_text, countries, devices, payment_methods, requirements, image_url, direct_url, category_id, category:categories(id, name)"
            )
            .in("status", canReviewPending ? ["pending", "published"] : ["published"])
            .eq("id", Number(prefixedId[1]))
            .maybeSingle();
          data = fallback.data;
          error = fallback.error;
        }
      }

      if (error) {
        console.error("Failed to load opportunity", error.message, error.code, error.details, error.hint);
        setError(`${t.detailPage.notFound} (${error.message})`);
        setLoading(false);
        return;
      }

      if (!data) {
        setError(t.detailPage.notFound);
        setLoading(false);
        return;
      }

      const { data: translations } = await supabase
        .from("opportunity_translations")
        .select("language_code, title, short_description, description, earnings_text, countries, devices, payment_methods, requirements")
        .eq("opportunity_id", data.id);

      const translationMap = new Map(
        (translations ?? []).map((translation) => [
          String(translation.language_code).split("-")[0].toLowerCase(),
          translation,
        ]),
      );
      const localized = translationMap.get(languageKey);
      const english = translationMap.get("en");
      setOpportunity({
        ...data,
        title: localized?.title || english?.title || data.title,
        short_description:
          localized?.short_description || localized?.description ||
          english?.short_description || english?.description || data.short_description,
        description: localized?.description || english?.description || data.description,
        earnings_text: localized?.earnings_text || english?.earnings_text || data.earnings_text,
        countries: localized?.countries?.length ? localized.countries : english?.countries?.length ? english.countries : data.countries,
        devices: localized?.devices?.length ? localized.devices : english?.devices?.length ? english.devices : data.devices,
        payment_methods: localized?.payment_methods?.length ? localized.payment_methods : english?.payment_methods?.length ? english.payment_methods : data.payment_methods,
        requirements: localized?.requirements?.length ? localized.requirements : english?.requirements?.length ? english.requirements : data.requirements,
        category: data.category,
      });
      setLoading(false);
    }

    if (slug) {
      loadOpportunity();
    }
  }, [router, slug, languageKey, t.detailPage.notFound]);
  useEffect(() => {
    async function checkFavorite() {
      if (!opportunity) return;

      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunity.id)
        .maybeSingle();

      setIsFavorite(!!data);
    }

    checkFavorite();
  }, [opportunity]);

  async function recordOpportunityStart(url: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !opportunity) return false;

    const { error } = await supabase.from("opportunity_events").insert({
      user_id: user.id,
      opportunity_id: opportunity.id,
      event_type: "started",
      metadata: { url },
    });
    if (error) {
      console.error("Failed to record opportunity click", error);
      return false;
    }
    return true;
  }

  if (loading) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-4xl px-6 py-16">
        <p className="text-zinc-500">{t.detailPage.loading}</p>
      </main>
    );
  }

  if (error || !opportunity) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-bold">{t.detailPage.notFound}</h1>

        <Link
          href="/opportunities"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-2 text-sm font-medium text-white"
        >
          {t.detailPage.backToOpportunities}
        </Link>
      </main>
    );
  }

  const category = normalizeOpportunityCategory(opportunity.category, language);
  const startUrl = getOpportunityStartUrl(opportunity);
  const title = getLocalizedText(opportunity.title, language, "en") ?? "Opportunity";
  const deviceList = localizeDevice(opportunity.devices, language) ?? "";
  const countryList = joinLocalizedOpportunityList(opportunity.countries, language, localizeCountry);
  const paymentList = joinLocalizedOpportunityList(opportunity.payment_methods, language, localizePaymentMethod);
  const paymentMethods = paymentList
    ? paymentList.split(language === "ar" ? "، " : ", ").filter(Boolean)
    : [];
  const localizedEarnings = getLocalizedText(opportunity.earnings_text, language, "en") ?? opportunity.earnings_text;
  const requirementsList = joinLocalizedOpportunityList(opportunity.requirements, language, localizeRequirement);
  const categoryName = category ? getLocalizedText(category.name, language, "en") ?? category.name : "";

  return (
    <main dir={dir} className="mx-auto w-full max-w-4xl px-6 py-12">
      <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {opportunity.image_url && (
          <img
            src={opportunity.image_url}
            alt={title}
            className="mb-6 h-64 w-full rounded-xl object-cover"
          />
        )}

        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="mt-5 flex flex-wrap gap-3">
        <button
  type="button"
  onClick={async () => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(t.detailPage.loginFirst);
      return;
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunity.id);

      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        opportunity_id: opportunity.id,
      });

      setIsFavorite(true);
    }
  }}
  aria-label={isFavorite ? t.detailPage.removeFavorite : t.detailPage.addFavorite}
  title={isFavorite ? t.detailPage.removeFavorite : t.detailPage.addFavorite}
  className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
>
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
  <span className="sr-only">{isFavorite ? t.detailPage.removeFavorite : t.detailPage.addFavorite}</span>
</button>

<button
  type="button"
  onClick={async () => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(t.detailPage.loginFirst);
      return;
    }
    const { error } = await supabase.rpc("create_report", {
      p_opportunity_id: Number(opportunity.id),
      p_report_type: "other",
      p_message: null,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already reported")) {
        alert(t.detailPage.alreadyReported);
        return;
      }
      alert(
        `${t.detailPage.reportError}:\n${JSON.stringify(error, null, 2)}`
      );
      return;
    }

    alert(t.detailPage.reportSubmitted);
  }}
  aria-label={t.detailPage.reportOpportunity}
  title={t.detailPage.reportOpportunity}
  className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
>
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21V5" />
    <path d="M5 5c4-3 7 3 14 0v10c-7 3-10-3-14 0" />
  </svg>
  <span className="sr-only">{t.detailPage.reportOpportunity}</span>
</button>
        </div>

{category && (
          <p className="mt-2 text-sm text-zinc-500">
            {t.detailPage.category}: {categoryName}
          </p>
        )}

        {opportunity.short_description && opportunity.short_description !== opportunity.description && (
          <p className="mt-5 text-lg leading-8 text-zinc-700">
            {getLocalizedText(opportunity.short_description, language, "en") ?? opportunity.short_description}
          </p>
        )}

        {opportunity.description && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">{t.detailPage.details}</h2>

            <p className="mt-3 leading-8 text-zinc-600">
              {getLocalizedText(opportunity.description, language, "en") ?? opportunity.description}
            </p>
          </div>
        )}

        {localizedEarnings && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">{t.detailPage.earnings}</h2>
            <p className="mt-2 text-zinc-600">
              {localizedEarnings}
            </p>
          </div>
        )}

        {deviceList && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">{t.detailPage.devices}</h2>
            <p className="mt-2 text-zinc-600">{deviceList}</p>
          </div>
        )}

        {countryList && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">{t.detailPage.countries}</h2>
            <p className="mt-2 text-zinc-600">{countryList}</p>
          </div>
        )}

        {paymentList && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">{t.detailPage.paymentMethods}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {paymentMethods.map((paymentMethod) => (
                <span
                  key={paymentMethod}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                >
                  {paymentMethod}
                </span>
              ))}
            </div>
          </div>
        )}

        {requirementsList && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">{t.detailPage.requirements}</h2>
              <ul className="mt-2 list-disc space-y-1 pr-6 text-zinc-600">
                <li>{requirementsList}</li>
              </ul>
            </div>
          )}

        {opportunity.verification_status && (
          <p className={`mt-8 inline-flex rounded-full px-3 py-1 text-sm ${isVerifiedOpportunity(opportunity.verification_status) ? "bg-green-100 font-semibold text-green-700" : "text-zinc-500"}`}>
            {t.detailPage.verification}: {localizeVerification(opportunity.verification_status, language) ?? opportunity.verification_status}
          </p>
        )}

        {opportunity.direct_url && (
          <p className="mt-6 break-all text-sm text-zinc-500">
            {language === "ar" ? "رابط الفرصة" : "Opportunity link"}: {opportunity.direct_url}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {startUrl && (
            <a
              href={startUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={async (event) => {
                event.preventDefault();
                const newWindow = window.open("about:blank", "_blank");
                await recordOpportunityStart(startUrl);
                if (newWindow) {
                  newWindow.location.href = startUrl;
                } else {
                  window.location.href = startUrl;
                }
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t.detailPage.startOpportunity}
            </a>
          )}

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-3 font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            {t.detailPage.backToPreviousPage}
          </button>
        </div>
      </article>
    </main>
  );
}