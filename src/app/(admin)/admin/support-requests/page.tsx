"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";

type RequestStatus = "open" | "in_progress" | "resolved" | "closed";
type SupportRequest = {
  id: number;
  email: string;
  issue_type: string;
  description: string;
  response: string | null;
  status: RequestStatus;
  created_at: string;
};

export default function SupportRequestsPage() {
  const { dir, language } = useLanguage();
  const isArabic = dir === "rtl";
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const copy = isArabic
    ? { title: "طلبات الدعم", description: "طلبات المساعدة المرسلة من المستخدمين.", empty: "لا توجد طلبات دعم حاليًا.", access: "ليس لديك صلاحية لإدارة طلبات الدعم.", error: "تعذر تنفيذ الإجراء.", email: "البريد", type: "نوع المشكلة", issue: "الوصف", response: "الرد على المستخدم", send: "إرسال وحفظ", status: "الحالة", date: "التاريخ", account: "الحساب", opportunity: "الفرص", payment: "المدفوعات", technical: "تقنية", other: "أخرى", open: "جديد", inProgress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلق" }
    : { title: "Support requests", description: "Help requests submitted by users.", empty: "There are no support requests.", access: "You do not have access to manage support requests.", error: "Could not complete the action.", email: "Email", type: "Issue type", issue: "Description", response: "Reply to user", send: "Send and save", status: "Status", date: "Date", account: "Account", opportunity: "Opportunities", payment: "Payments", technical: "Technical", other: "Other", open: "Open", inProgress: "In progress", resolved: "Resolved", closed: "Closed" };
  const issueLabels: Record<string, string> = { account: copy.account, opportunity: copy.opportunity, payment: copy.payment, technical: copy.technical, other: copy.other };
  const statusLabels: Record<RequestStatus, string> = { open: copy.open, in_progress: copy.inProgress, resolved: copy.resolved, closed: copy.closed };

  useEffect(() => {
    async function loadRequests() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage(copy.access); setLoading(false); return; }
      const { data: allowed } = await supabase.rpc("has_support_permission", { p_permission: "manage_support_requests" });
      if (!allowed) { setMessage(copy.access); setLoading(false); return; }
      const { data, error } = await supabase.from("support_requests").select("id, email, issue_type, description, response, status, created_at").order("created_at", { ascending: false });
      setLoading(false);
      if (error) { setMessage(copy.error); return; }
      const loaded = (data ?? []) as SupportRequest[];
      setRequests(loaded);
      setResponses(Object.fromEntries(loaded.map((request) => [request.id, request.response ?? ""])));
    }
    void loadRequests();
  }, [copy.access, copy.error]);

  async function saveRequest(request: SupportRequest, status = request.status) {
    setUpdatingId(request.id);
    setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("update_support_request_status", {
      p_request_id: request.id,
      p_status: status,
      p_response: responses[request.id] ?? "",
    });
    setUpdatingId(null);
    if (error) { setMessage(error.message || copy.error); return; }
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status, response: responses[request.id] ?? "" } : item));
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-8"><h1 className="text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-zinc-500">{copy.description}</p></div>
      {message && <p className="mb-5 rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}
      {loading ? <p className="text-zinc-500">...</p> : requests.length === 0 ? <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">{copy.empty}</div> : (
        <div className="mx-auto grid max-w-5xl gap-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[.9fr_1.1fr_1.4fr]">
                <div><p className="text-xs text-zinc-500">{copy.email}</p><p dir="ltr" className="mt-1 text-sm font-medium">{request.email}</p><p className="mt-3 text-xs text-zinc-500">{copy.type}</p><p className="mt-1 text-sm">{issueLabels[request.issue_type] ?? request.issue_type}</p></div>
                <div><p className="text-xs text-zinc-500">{copy.issue}</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{request.description}</p></div>
                <div>{request.response ? <div className="rounded-lg bg-[#f0efff] p-3"><p className="text-xs font-semibold text-[#3b3971]">{copy.response}</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{request.response}</p></div> : <><label className="text-sm font-medium">{copy.response}<textarea rows={2} value={responses[request.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [request.id]: event.target.value }))} className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></label><button type="button" disabled={updatingId === request.id} onClick={() => void saveRequest(request)} className="mt-2 inline-flex min-h-9 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{copy.send}</button></>}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3"><select value={request.status} disabled={updatingId === request.id} onChange={(event) => void saveRequest(request, event.target.value as RequestStatus)} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs"><option value="open">{statusLabels.open}</option><option value="in_progress">{statusLabels.in_progress}</option><option value="resolved">{statusLabels.resolved}</option><option value="closed">{statusLabels.closed}</option></select><time className="text-xs text-zinc-500">{new Date(request.created_at).toLocaleString(language === "ar" ? "ar-SA" : language)}</time></div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
