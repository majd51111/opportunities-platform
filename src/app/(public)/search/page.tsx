"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { countriesByLanguage } from "@/lib/countries";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import type { Opportunity } from "@/types";
import { getLocalizedText, joinLocalizedList, normalizeOpportunityCategory, localizeCategory, localizeDevice, isVerifiedOpportunity } from "@/types";

export default function SearchPage() {
  const { t, dir, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: unknown }[]>([]);
  const countryOptions = countriesByLanguage[language] ?? countriesByLanguage.en;
useEffect(() => {
  async function loadCategories() {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("id", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }

    setCategories(data ?? []);
  }

  loadCategories();
}, []);
  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const searchText = query.trim();
    if (!searchText && !categoryId && !device && !country) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const supabase = getSupabaseBrowserClient();
    let request = supabase
    .from("opportunities")
    .select(
      "id, title, slug, short_description, description, earnings_text, verification_status, devices, countries, payment_methods, requirements, direct_url, category:categories(id, name, translations)"
    )
    .eq("status", "published");
  
  if (categoryId) {
    request = request.eq("category_id", categoryId);
  }
  if (device) {
    request = request.contains("devices", [device]);
  }
  if (country) {
    request = request.contains("countries", [country]);
  }
  
  if (searchText) {

  request = request.or(
    "title.ilike.%" +
      searchText +
      "%,short_description.ilike.%" +
      searchText +
      "%,description.ilike.%" +
      searchText +
      "%"
  );
}
  
  request = request.order("created_at", { ascending: false });
    const { data, error } = await request;
    if (error) {
      console.error(error);
      setResults([]);
      setLoading(false);
      return;
    }

    const opportunities = data ?? [];
    const { data: translations, error: translationsError } = await supabase
      .from("opportunity_translations")
      .select("opportunity_id, language_code, title, short_description, description, earnings_text, countries, devices, payment_methods, requirements")
      .in("opportunity_id", opportunities.map((opportunity) => opportunity.id));

    if (translationsError) {
      console.error(translationsError);
      setResults(opportunities);
    } else {
      const languageKey = String(language).split("-")[0].toLowerCase();
      const translationsByOpportunity = new Map<string, Record<string, Record<string, unknown>>>();

      for (const translation of translations ?? []) {
        const opportunityId = String(translation.opportunity_id);
        if (!translationsByOpportunity.has(opportunityId)) translationsByOpportunity.set(opportunityId, {});
        const languageTranslations = translationsByOpportunity.get(opportunityId)!;
        languageTranslations[String(translation.language_code).split("-")[0].toLowerCase()] = translation;
      }

      setResults(opportunities.map((opportunity) => {
        const translationsForOpportunity = translationsByOpportunity.get(String(opportunity.id));
        const localized = translationsForOpportunity?.[languageKey] ?? translationsForOpportunity?.en;
        return localized ? {
          ...opportunity,
          title: localized.title ?? opportunity.title,
          short_description: localized.short_description ?? localized.description ?? opportunity.short_description,
          description: localized.description ?? opportunity.description,
          earnings_text: localized.earnings_text ?? opportunity.earnings_text,
          countries: localized.countries ?? opportunity.countries,
          devices: localized.devices ?? opportunity.devices,
          payment_methods: localized.payment_methods ?? opportunity.payment_methods,
          requirements: localized.requirements ?? opportunity.requirements,
        } : opportunity;
      }));
    }
    setLoading(false);
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.searchPage.title}</h1>
        <p className="mt-2 text-zinc-500">{t.searchPage.subtitle}</p>
      </div>
      <select
  value={categoryId}
  onChange={(e) => setCategoryId(e.target.value)}
  className="mb-4 w-full rounded-lg border border-zinc-300 px-4 py-3"
>
  <option value="">{t.searchPage.allCategories}</option>

  {categories.map((category) => (
    <option key={category.id} value={category.id}>
      {localizeCategory(category.name, language) ?? ""}
    </option>
  ))}
</select>
<select
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  className="mb-4 w-full rounded-lg border border-zinc-300 px-4 py-3"
>
  <option value="">{t.searchPage.allCountries}</option>

  {countryOptions.map((countryName) => (
    <option key={countryName} value={countryName}>
      {countryName}
    </option>
  ))}
</select>
<select
  value={device}
  onChange={(e) => setDevice(e.target.value)}
  className="mb-4 w-full rounded-lg border border-zinc-300 px-4 py-3"
>
  <option value="">{t.searchPage.allDevices}</option>
  <option value="Android">Android</option>
  <option value="iPhone">iPhone</option>
  <option value="Computer">Computer</option>
</select>
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPage.placeholder}
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-6 py-3 font-medium text-white"
        >
          {loading ? t.searchPage.searching : t.searchPage.search}
        </button>
      </form>

      {searched && !loading && (
        <div className="mt-8">
          {results.length === 0 ? (
            <p className="text-zinc-500">{t.searchPage.noMatches}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((opportunity) => {
                const category = normalizeOpportunityCategory(opportunity.category, language);
                const title = getLocalizedText(opportunity.title, language, "en") ?? "Opportunity";
                const deviceList = localizeDevice(opportunity.devices, language) ?? "";
                const countryList = joinLocalizedList(opportunity.countries, language);

                return (
                  <article
                    key={opportunity.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                  >
                    <h2 className="text-xl font-semibold">{title}</h2>
                    {isVerifiedOpportunity(opportunity.verification_status) && (
                      <p className="mt-2 text-sm font-medium text-green-600">
                        {t.searchPage.verified}
                      </p>
                    )}
                    {deviceList && (
                      <p className="mt-2 text-sm text-zinc-500">
                        {t.searchPage.devices}: {deviceList}
                      </p>
                    )}
                    {countryList && (
                      <p className="mt-2 text-sm text-zinc-500">
                        {t.searchPage.countries}: {countryList}
                      </p>
                    )}

                    {category && <p className="mt-2 text-sm font-medium text-black">{t.detailPage.category}: <span className="text-red-600">{localizeCategory(category.name, language) ?? category.name}</span></p>}

                    {opportunity.earnings_text && (
                      <p className="mt-4 text-green-600">
                        {t.opportunitiesPage.earnings}: {getLocalizedText(opportunity.earnings_text, language, "en") ?? opportunity.earnings_text}
                      </p>
                    )}

                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="mt-5 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                      {t.opportunitiesPage.viewOpportunity}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}