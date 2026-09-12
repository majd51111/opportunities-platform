"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

type Submission = {
  id: string | number;
  title: string;
  slug: string;
  short_description: string | null;
  direct_url: string | null;
  earnings_text: string | null;
};

export default function AdminOpportunitiesPage() {
  const { dir, language, t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | number | null>(null);
  const copy = getPageCopy(language).review;

  async function loadSubmissions() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage(copy.access); setLoading(false); return; }
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!role || !["admin", "support"].includes(role.role)) { setMessage(copy.access); setLoading(false); return; }
    const { data, error } = await supabase.from("opportunities").select("id, title, slug, short_description, direct_url, earnings_text").eq("status", "pending").order("created_at", { ascending: true });
    setLoading(false);
    if (error) { setMessage(`${copy.error} ${error.message}`); return; }
    if ((data ?? []).length === 0) {
      setMessage(`${copy.pending} (لم يتم العثور على فرص بحالة pending في قاعدة البيانات الحالية)`);
    }
    setSubmissions((data ?? []) as Submission[]);
  }

  useEffect(() => { void loadSubmissions(); }, []);

  async function reviewSubmission(id: string | number, status: "published" | "rejected") {
    setReviewingId(id); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("review_opportunity", { p_opportunity_id: String(id), p_status: status });
    setReviewingId(null);
    if (error) { setMessage(`${copy.error} ${error.message}`); return; }
    setSubmissions((current) => current.filter((submission) => submission.id !== id));
  }

  return <main dir={dir} className="mx-auto w-full max-w-6xl px-6 py-12">
    <div className="mb-8"><h1 className="text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-zinc-500">{copy.description}</p></div>
    {message && <p className="mb-5 rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}
    {loading ? <p className="text-zinc-500">...</p> : submissions.length === 0 ? <p className="text-zinc-500">{copy.pending}</p> : <div className="grid gap-5 md:grid-cols-2">{submissions.map((submission) => <article key={submission.id} className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">{submission.title}</h2><p className="mt-2 text-zinc-600">{submission.short_description}</p>{submission.earnings_text && <p className="mt-4 text-sm text-zinc-600">{submission.earnings_text}</p>}{submission.direct_url && <a href={submission.direct_url} target="_blank" rel="noopener noreferrer" className="mt-4 break-all text-sm text-[#4c3ecb] underline">{submission.direct_url}</a>}<div className="mt-auto grid gap-3 pt-5"><Link href={`/opportunities/${submission.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">{t.opportunitiesPage.viewOpportunity}</Link><div className="grid grid-cols-2 gap-3"><button type="button" disabled={reviewingId === submission.id} onClick={() => void reviewSubmission(submission.id, "published")} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{copy.approve}</button><button type="button" disabled={reviewingId === submission.id} onClick={() => void reviewSubmission(submission.id, "rejected")} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">{copy.reject}</button></div></div></article>)}</div>}
  </main>;
}
