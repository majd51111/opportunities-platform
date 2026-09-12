"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { routes } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

type IssueType = "account" | "opportunity" | "payment" | "technical" | "other";
export default function SupportPage() {
  const { dir, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("account");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const copy = getPageCopy(language).support;

  useEffect(() => {
    async function loadSupportData() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setEmail(user.email);
    }
    void loadSupportData();
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSaving(true);
    const { data: requestId, error } = await getSupabaseBrowserClient().rpc("create_support_request", { p_email: email.trim(), p_issue_type: issueType, p_description: description.trim() });
    setSaving(false);
    if (error) { setMessage(error.message || copy.error); return; }
    setDescription(""); setIssueType("account"); setMessage(copy.success);
    void requestId;
  }

  return <main dir={dir} className="mx-auto w-full max-w-4xl px-6 py-12"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-zinc-500">{copy.subtitle}</p></div><Link href={routes.platform.supportRequests} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-[#2563eb] hover:text-[#2563eb]">{copy.requests}</Link></div><section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"><form className="grid gap-5" onSubmit={submitRequest}><label className="grid gap-2 text-sm font-medium">{copy.email}<input required type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal text-left" /></label><label className="grid gap-2 text-sm font-medium">{copy.type}<select value={issueType} onChange={(event) => setIssueType(event.target.value as IssueType)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal"><option value="account">{copy.account}</option><option value="opportunity">{copy.opportunity}</option><option value="payment">{copy.payment}</option><option value="technical">{copy.technical}</option><option value="other">{copy.other}</option></select></label><label className="grid gap-2 text-sm font-medium">{copy.description}<textarea required rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>{message && <p className="rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}<button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{copy.submit}</button></form></section></main>;
}
