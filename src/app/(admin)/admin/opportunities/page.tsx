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
  description?: string | null;
  countries?: string[] | null;
  devices?: string[] | null;
  payment_methods?: string[] | null;
  requirements?: string[] | null;
  status: string;
};

function listToText(value: string[] | null | undefined): string {
  return (value ?? []).join(", ");
}

function textToList(value: string): string[] | null {
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

export default function AdminOpportunitiesPage() {
  const { dir, language, t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | number | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [translating, setTranslating] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", short_description: "", description: "", direct_url: "", earnings_text: "", countries: "", devices: "", payment_methods: "", requirements: "" });
  const copy = getPageCopy(language).review;
  const fieldCopy = getPageCopy(language).submit;

  async function loadSubmissions() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage(copy.access); setLoading(false); return; }
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!role || !["admin", "support"].includes(role.role)) { setMessage(copy.access); setLoading(false); return; }
    const { data, error } = await supabase.from("opportunities").select("id, title, slug, short_description, description, direct_url, earnings_text, countries, devices, payment_methods, requirements, status").eq("status", "pending").order("created_at", { ascending: true });
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

  function startEditing(submission: Submission) {
    setEditingId(submission.id);
    setEditForm({ title: submission.title, short_description: submission.short_description ?? "", description: submission.description ?? "", direct_url: submission.direct_url ?? "", earnings_text: submission.earnings_text ?? "", countries: listToText(submission.countries), devices: listToText(submission.devices), payment_methods: listToText(submission.payment_methods), requirements: listToText(submission.requirements) });
  }

  async function saveEdit(id: string | number) {
    setReviewingId(id); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("update_pending_opportunity", { p_opportunity_id: String(id), p_title: editForm.title, p_short_description: editForm.short_description, p_description: editForm.description, p_direct_url: editForm.direct_url, p_earnings_text: editForm.earnings_text || null, p_countries: textToList(editForm.countries), p_devices: textToList(editForm.devices), p_payment_methods: textToList(editForm.payment_methods), p_requirements: textToList(editForm.requirements) });
    setReviewingId(null);
    if (error) { setMessage(`${copy.error} ${error.message}`); return; }
    setSubmissions((current) => current.map((item) => item.id === id ? { ...item, title: editForm.title, short_description: editForm.short_description, description: editForm.description, direct_url: editForm.direct_url, earnings_text: editForm.earnings_text, countries: textToList(editForm.countries), devices: textToList(editForm.devices), payment_methods: textToList(editForm.payment_methods), requirements: textToList(editForm.requirements) } : item));
    setEditingId(null);
  }

  async function translateCurrentOpportunities() {
    if (submissions.length === 0) return;
    setTranslating(true); setMessage("");
    let translatedCount = 0;
    let failedCount = 0;
    let lastError = "";
    const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

    for (const submission of submissions) {
      let completed = false;
      for (let attempt = 0; attempt < 3 && !completed; attempt += 1) {
        try {
          const response = await fetch("/api/translations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: submission.title,
              shortDescription: submission.short_description ?? "",
              description: submission.description ?? "",
              earningsText: submission.earnings_text || null,
              countries: submission.countries ?? [],
              devices: submission.devices ?? [],
              paymentMethods: submission.payment_methods ?? [],
              requirements: submission.requirements ?? [],
            }),
          });
          const payload = await response.json() as { translations?: Record<string, { title: string; shortDescription: string; description: string; earningsText: string | null; countries: string[]; devices: string[]; paymentMethods: string[]; requirements: string[] }>; error?: string };
          if (!response.ok || !payload.translations) {
            const providerError = payload.error ?? "Translation failed";
            const retryMatch = providerError.match(/retry in ([\d.]+)s/i);
            if (retryMatch && attempt < 2) {
              await wait(Math.min(Math.ceil(Number(retryMatch[1]) * 1000) + 1000, 60000));
              continue;
            }
            throw new Error(providerError);
          }
          const rows = Object.entries(payload.translations).map(([languageCode, translation]) => ({ language_code: languageCode, title: translation.title, short_description: translation.shortDescription, description: translation.description, earnings_text: translation.earningsText, countries: translation.countries, devices: translation.devices, payment_methods: translation.paymentMethods, requirements: translation.requirements }));
          const { error } = await getSupabaseBrowserClient().rpc("save_opportunity_translations", { p_opportunity_id: Number(submission.id), p_translations: rows });
          if (error) throw error;
          translatedCount += 1;
          completed = true;
        } catch (translationError) {
          lastError = translationError instanceof Error ? translationError.message : "Translation failed";
          if (attempt < 2) await wait(2000);
        }
      }
      if (!completed) failedCount += 1;
    }

    setMessage(failedCount === 0 ? `${copy.translated} (${translatedCount})` : `${copy.translated}: ${translatedCount}; ${copy.error}: ${failedCount}. ${lastError}`);
    setTranslating(false);
  }

  async function deletePublishedOpportunity(id: string | number) {
    if (!window.confirm("Delete this published opportunity permanently?")) return;
    setReviewingId(id); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("delete_opportunity_as_admin", { p_opportunity_id: String(id) });
    setReviewingId(null);
    if (error) { setMessage(`${copy.error} ${error.message}`); return; }
    setSubmissions((current) => current.filter((item) => item.id !== id));
  }

  const editListFields = <div className="grid gap-4 sm:grid-cols-2">
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      <span>{fieldCopy.countries}</span>
      <input value={editForm.countries} onChange={(event) => setEditForm({ ...editForm, countries: event.target.value })} placeholder={fieldCopy.optional} className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" />
    </label>
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      <span>{fieldCopy.devices}</span>
      <input value={editForm.devices} onChange={(event) => setEditForm({ ...editForm, devices: event.target.value })} placeholder={fieldCopy.optional} className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" />
    </label>
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
      <span>{fieldCopy.paymentMethods}</span>
      <input value={editForm.payment_methods} onChange={(event) => setEditForm({ ...editForm, payment_methods: event.target.value })} placeholder={fieldCopy.optional} className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" />
    </label>
    <label className="grid gap-1.5 text-sm font-medium text-zinc-700 sm:col-span-2">
      <span>{fieldCopy.requirements}</span>
      <textarea rows={3} value={editForm.requirements} onChange={(event) => setEditForm({ ...editForm, requirements: event.target.value })} placeholder={fieldCopy.optional} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" />
    </label>
  </div>;

  return <main dir={dir} className="mx-auto w-full max-w-6xl px-6 py-12">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-zinc-500">{copy.description}</p></div><button type="button" disabled={translating || submissions.length === 0} onClick={() => void translateCurrentOpportunities()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:opacity-50">{translating ? copy.translating : copy.translate}</button></div>
    {message && <p className="mb-5 rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}
    {loading ? <p className="text-zinc-500">...</p> : submissions.length === 0 ? <p className="text-zinc-500">{copy.pending}</p> : <div className="grid gap-5 md:grid-cols-2">{submissions.map((submission) => <article key={submission.id} className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{editingId === submission.id ? <div className="grid gap-3">{editListFields}<input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2 text-xl font-semibold" /><input value={editForm.short_description} onChange={(event) => setEditForm({ ...editForm, short_description: event.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2" /><textarea rows={5} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2" /><input dir="ltr" value={editForm.direct_url} onChange={(event) => setEditForm({ ...editForm, direct_url: event.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2" /><input value={editForm.earnings_text} onChange={(event) => setEditForm({ ...editForm, earnings_text: event.target.value })} className="rounded-lg border border-zinc-300 px-3 py-2" /><div className="flex gap-3"><button type="button" disabled={reviewingId === submission.id} onClick={() => void saveEdit(submission.id)} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{copy.save}</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">{copy.cancel}</button></div></div> : <><h2 className="text-xl font-semibold">{submission.title}</h2><p className="mt-2 text-zinc-600">{submission.short_description}</p>{submission.earnings_text && <p className="mt-4 text-sm text-zinc-600">{submission.earnings_text}</p>}{submission.direct_url && <a href={submission.direct_url} target="_blank" rel="noopener noreferrer" className="mt-4 break-all text-sm text-[#4c3ecb] underline">{submission.direct_url}</a>}<div className="mt-auto grid gap-3 pt-5"><Link href={`/opportunities/${submission.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">{t.opportunitiesPage.viewOpportunity}</Link><div className="grid grid-cols-3 gap-3"><button type="button" onClick={() => startEditing(submission)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">{copy.edit}</button><button type="button" disabled={reviewingId === submission.id} onClick={() => void reviewSubmission(submission.id, "published")} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{copy.approve}</button><button type="button" disabled={reviewingId === submission.id} onClick={() => void reviewSubmission(submission.id, "rejected")} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">{copy.reject}</button></div></div></>}</article>)}</div>}
  </main>;
}
