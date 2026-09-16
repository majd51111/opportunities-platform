"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getLocalizedText } from "@/types";
import { useLanguage } from "@/providers/app-providers";

type EventRow = {
  opportunity_id: number;
  user_id: string;
  created_at: string;
};

type OpportunityRow = {
  id: number;
  title: unknown;
};

export default function AdminAnalyticsPage() {
  const { dir, language } = useLanguage();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const [{ data: eventData, error: eventError }, { data: opportunityData, error: opportunityError }] = await Promise.all([
        supabase
          .from("opportunity_events")
          .select("opportunity_id, user_id, created_at")
          .eq("event_type", "started")
          .order("created_at", { ascending: false }),
        supabase.from("opportunities").select("id, title"),
      ]);

      if (eventError || opportunityError) {
        setError(eventError?.message ?? opportunityError?.message ?? "Unable to load analytics");
      } else {
        setEvents((eventData ?? []) as EventRow[]);
        setOpportunities((opportunityData ?? []) as OpportunityRow[]);
      }
      setLoading(false);
    }

    void loadAnalytics();
  }, []);

  const opportunityTitles = new Map(
    opportunities.map((opportunity) => [
      String(opportunity.id),
      getLocalizedText(opportunity.title, language, "en") ?? "Opportunity",
    ]),
  );
  const clicksByOpportunity = new Map<string, number>();
  const uniqueUsers = new Set<string>();

  for (const event of events) {
    const key = String(event.opportunity_id);
    clicksByOpportunity.set(key, (clicksByOpportunity.get(key) ?? 0) + 1);
    uniqueUsers.add(event.user_id);
  }

  const topOpportunities = [...clicksByOpportunity.entries()]
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 10);

  const labels = language === "ar"
    ? { title: "إحصاءات النقرات", total: "إجمالي النقرات", users: "مستخدمون مختلفون", opportunities: "فرص تم فتحها", ranking: "الأكثر جذبًا", empty: "لا توجد نقرات مسجلة بعد", loading: "جار التحميل..." }
    : { title: "Click analytics", total: "Total clicks", users: "Unique users", opportunities: "Opportunities opened", ranking: "Top opportunities", empty: "No clicks recorded yet", loading: "Loading..." };

  return (
    <section className="mx-auto w-full max-w-5xl" dir={dir}>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{labels.title}</h1>

      {loading ? (
        <p className="mt-8 text-zinc-500">{labels.loading}</p>
      ) : error ? (
        <p className="mt-8 text-red-600">{error}</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{labels.total}</p>
              <p className="mt-2 text-3xl font-semibold">{events.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{labels.users}</p>
              <p className="mt-2 text-3xl font-semibold">{uniqueUsers.size}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{labels.opportunities}</p>
              <p className="mt-2 text-3xl font-semibold">{clicksByOpportunity.size}</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{labels.ranking}</h2>
            {topOpportunities.length === 0 ? (
              <p className="mt-5 text-zinc-500">{labels.empty}</p>
            ) : (
              <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                {topOpportunities.map(([opportunityId, count]) => (
                  <div key={opportunityId} className="flex items-center justify-between gap-4 py-3">
                    <span className="truncate text-zinc-700 dark:text-zinc-300">
                      {opportunityTitles.get(opportunityId) ?? `#${opportunityId}`}
                    </span>
                    <span className="shrink-0 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
