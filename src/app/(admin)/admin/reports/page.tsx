"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLanguage } from "@/providers/app-providers";

type Report = {
  id: number;
  user_id: string;
  opportunity_id: number;
  report_type: string;
  message: string | null;
  status: string | null;
  created_at: string;
};

export default function AdminReportsPage() {
  const supabase = createSupabaseBrowserClient();

  const { language, dir, t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("reports")
      .select(
        "id, user_id, opportunity_id, report_type, message, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("REPORTS ERROR:", error);
      setError(error.message);
      setReports([]);
    } else {
      setReports(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .rpc("update_report_status", { p_report_id: id, p_status: status });

    if (error) {
      const details = [error.message, error.details, error.hint].filter(Boolean).join(" ");
      alert(`${t.admin?.reports?.updateError ?? "An error occurred while updating status"}${details ? `: ${details}` : ""}`);
      console.error("Failed to update report status:", details || error.code);
      return;
    }

    setReports((current) =>
      current.map((report) =>
        report.id === id ? { ...report, status } : report
      )
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12" dir={dir}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.admin?.reports?.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {t.admin?.reports?.description}
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-[#6c5cf5] hover:bg-[#f0efff] hover:text-[#4c3ecb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t.admin?.reports?.refresh}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">{t.admin?.reports?.loading}</div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700 shadow-sm">
          <strong>{t.messages.errorLabel ?? "Error:"}</strong> {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">{t.admin?.reports?.noReports}</div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="border-b border-zinc-200 bg-[#f0efff] text-[#3b3971]">
              <tr>
                <th className="px-4 py-3">{t.admin?.reports?.table.id}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.user}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.opportunity}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.type}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.message}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.status}</th>
                <th className="px-4 py-3">{t.admin?.reports?.table.date}</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-zinc-200 last:border-0 hover:bg-[#faf9ff]">
                  <td className="px-4 py-3 font-medium">{report.id}</td>

                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{report.user_id}</span>
                  </td>

                  <td className="px-4 py-3">{report.opportunity_id}</td>

                  <td className="px-4 py-3">{report.report_type || t.admin?.reports?.notSpecified}</td>

                  <td className="max-w-xs px-4 py-3">{report.message || t.admin?.reports?.noMessage}</td>

                  <td className="px-4 py-3">
                    <select
                      value={report.status || "pending"}
                      onChange={(e) => updateStatus(report.id, e.target.value)}
                      className="min-w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
                    >
                      <option value="pending">{t.admin?.reports?.statusOptions.pending}</option>
                      <option value="reviewed">{t.admin?.reports?.statusOptions.reviewed}</option>
                      <option value="resolved">{t.admin?.reports?.statusOptions.resolved}</option>
                      <option value="rejected">{t.admin?.reports?.statusOptions.rejected}</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(report.created_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}