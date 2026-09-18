"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getLocalizedText, normalizeOpportunityCategory } from "@/types";

type FavoriteOpportunity = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  earnings_text: string | null;
  image_url: string | null;
  category: { id: number; name: string } | { id: number; name: string }[] | null;
};

type FavoriteOpportunityRow = {
  id: number;
  opportunities:
    | {
        id: number;
        title: string;
        slug: string;
        short_description: string | null;
        earnings_text: string | null;
        image_url: string | null;
        categories: { id: number; name: string }[] | null;
      }
    | {
        id: number;
        title: string;
        slug: string;
        short_description: string | null;
        earnings_text: string | null;
        image_url: string | null;
        categories: { id: number; name: string }[] | null;
      }[]
    | null;
};

export default function FavoritesPage() {
  const { t, dir, language } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFavorites() {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(t.favoritesPage.pleaseLogin);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          opportunities (
            id,
            title,
            slug,
            short_description,
            earnings_text,
            image_url,
            categories (
              id,
              name
            )
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage(t.favoritesPage.loadError);
        setLoading(false);
        return;
      }

      const favoriteRows = (data ?? []) as unknown as FavoriteOpportunityRow[];
      const formatted: FavoriteOpportunity[] = favoriteRows.flatMap(
        (favorite: FavoriteOpportunityRow) => {
          const opportunities = favorite.opportunities
            ? Array.isArray(favorite.opportunities)
              ? favorite.opportunities
              : [favorite.opportunities]
            : [];

          return opportunities.map(
            (opportunity): FavoriteOpportunity => ({
              id: opportunity.id,
              title: opportunity.title,
              slug: opportunity.slug,
              short_description: opportunity.short_description,
              earnings_text: opportunity.earnings_text,
              image_url: opportunity.image_url,
              category: opportunity.categories ?? null,
            })
          );
        }
      );

      setFavorites(formatted);
      setLoading(false);
    }

    loadFavorites();
  }, []);
  async function removeFavorite(opportunityId: number) {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId);

    if (error) {
      console.error(error);
      return;
    }

    setFavorites((current) =>
      current.filter((item) => item.id !== opportunityId)
    );
  }

  if (loading) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold">{t.favoritesPage.title}</h1>
        <p className="mt-4 text-zinc-500">{t.favoritesPage.loading}</p>
      </main>
    );
  }

  if (message) {
    return (
      <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-bold">{t.favoritesPage.title}</h1>
        <p className="mt-4 text-zinc-500">{message}</p>
      </main>
    );
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.favoritesPage.title}</h1>
        <p className="mt-2 text-zinc-500">{t.favoritesPage.subtitle}</p>
      </div>

      {favorites.length === 0 ? (
        <p className="text-zinc-500">{t.favoritesPage.empty}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {favorites.map((opportunity) => {
            const category = normalizeOpportunityCategory(opportunity.category, language);
            const title = getLocalizedText(opportunity.title, language, "en") ?? "Opportunity";
            const summary = getLocalizedText(opportunity.short_description, language, "en") ?? "";
            const localizedEarnings = getLocalizedText(opportunity.earnings_text, language, "en") ?? opportunity.earnings_text;

            return (
              <article
                key={opportunity.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                {opportunity.image_url && (
                  <img
                    src={opportunity.image_url}
                    alt={title}
                    className="mb-4 h-48 w-full rounded-xl object-cover"
                  />
                )}

                <h2 className="text-xl font-semibold">{title}</h2>

                {summary && <p className="mt-3 leading-6 text-red-600">{summary}</p>}

                {category && <p className="mt-3 text-sm font-medium text-zinc-600">{t.detailPage.category}: {getLocalizedText(category.name, language, "en") ?? category.name}</p>}

                {localizedEarnings && (
                  <p className="mt-2 font-medium">
                    {t.favoritesPage.earnings}: {localizedEarnings}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white"
                  >
                    {t.favoritesPage.viewOpportunity}
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFavorite(opportunity.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-center text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    {t.favoritesPage.remove}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}