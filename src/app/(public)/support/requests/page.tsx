"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { routes } from "@/config/routes";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

type IssueType = "account" | "opportunity" | "payment" | "technical" | "other";
type SupportRequest = { id: number; issue_type: IssueType; description: string; response: string | null; status: "open" | "in_progress" | "resolved" | "closed"; created_at: string };

export default function SupportRequestsPage() {
  const { dir, language } = useLanguage();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const copy = getPageCopy(language).support;
  const issueLabels: Record<IssueType, string> = { account: copy.account, opportunity: copy.opportunity, payment: copy.payment, technical: copy.technical, other: copy.other };
  const statusLabels: Record<SupportRequest["status"], string> = { open: copy.open, in_progress: copy.inProgress, resolved: copy.resolved, closed: copy.closed };

  useEffect(() => {
    async function loadRequests() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage(copy.error); setLoading(false); return; }
      const { data, error } = await supabase.from("support_requests").select("id, issue_type, description, response, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      setLoading(false);
      if (error) { setMessage(error.message || copy.error); return; }
      setRequests((data ?? []) as SupportRequest[]);
    }
    void loadRequests();
  }, [copy.error]);

  return <main dir={dir} className="mx-auto w-full max-w-3xl px-6 py-10"><div className="relative mb-6 min-h-16"><div className="pr-32"><h1 className="text-2xl font-bold">{copy.title}</h1><p className="mt-1 text-sm text-zinc-500">{copy.subtitle}</p></div><Link href={routes.public.support} className="absolute left-0 top-0 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1d4ed8]">{copy.newRequest}</Link></div>{message && <p className="mb-4 rounded-lg bg-[#f0efff] px-3 py-2 text-sm text-[#3b3971]">{message}</p>}{loading ? <p className="text-sm text-zinc-500">...</p> : requests.length === 0 ? <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">{copy.noReplies}</p> : <div className="grid gap-3">{requests.map((request) => <article key={request.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-zinc-500">{issueLabels[request.issue_type]}</p><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700">{statusLabels[request.status]}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{request.description}</p><div className="mt-3 rounded-lg bg-[#f0efff] p-3"><p className="text-xs font-semibold text-[#3b3971]">{copy.response}</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{request.response || copy.pending}</p></div><time className="mt-2 block text-[11px] text-zinc-400">{new Date(request.created_at).toLocaleString(language === "ar" ? "ar-SA" : language)}</time></article>)}</div>}</main>;
}
