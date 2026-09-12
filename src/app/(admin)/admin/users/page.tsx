"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  status: "active" | "suspended" | "banned";
};

type UserAction = "active" | "suspended" | "banned" | "remove";

export default function AdminUsersPage() {
  const { dir } = useLanguage();
  const isArabic = dir === "rtl";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const copy = isArabic
    ? {
      title: "المستخدمون",
      description: "قائمة مستخدمي المنصة وإدارة حالات حساباتهم.",
      empty: "لا يوجد مستخدمون حاليًا.",
      access: "هذه الصفحة متاحة للمدير فقط.",
      error: "تعذر تحميل المستخدمين.",
      actionError: "تعذر تنفيذ الإجراء.",
      confirmRemove: "هل أنت متأكد من إزالة هذا المستخدم نهائيًا؟",
      active: "نشط",
      suspended: "معلّق",
      banned: "محظور",
      activate: "إعادة التفعيل",
      suspend: "تعليق الحساب",
      ban: "حظر المستخدم",
      remove: "إزالة المستخدم",
    }
    : {
      title: "Users",
      description: "Platform user directory and account status management.",
      empty: "There are no users yet.",
      access: "This page is available to administrators only.",
      error: "Could not load users.",
      actionError: "Could not complete the action.",
      confirmRemove: "Are you sure you want to permanently remove this user?",
      active: "Active",
      suspended: "Suspended",
      banned: "Banned",
      activate: "Reactivate",
      suspend: "Suspend account",
      ban: "Ban user",
      remove: "Remove user",
    };

  useEffect(() => {
    async function loadUsers() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage(copy.access); setLoading(false); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (role?.role !== "admin") { setMessage(copy.access); setLoading(false); return; }
      const usersQuery = await supabase.from("user_profiles").select("id, email, full_name, status").order("created_at");
      setLoading(false);
      if (!usersQuery.error) {
        setProfiles((usersQuery.data ?? []) as Profile[]);
        return;
      }

      if (!usersQuery.error.message.toLowerCase().includes("status")) {
        setMessage(copy.error);
        return;
      }

      const legacyQuery = await supabase.from("user_profiles").select("id, email, full_name").order("created_at");
      if (legacyQuery.error) { setMessage(copy.error); return; }
      setProfiles((legacyQuery.data ?? []).map((profile) => ({ ...profile, status: "active" as const })));
    }

    void loadUsers();
  }, [copy.access, copy.error]);

  async function manageUser(profile: Profile, action: UserAction) {
    if (action === "remove" && !window.confirm(copy.confirmRemove)) return;

    setBusyUserId(profile.id);
    setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("manage_user", {
      p_user_id: profile.id,
      p_action: action,
    });
    setBusyUserId(null);

    if (error) {
      setMessage(error.message || copy.actionError);
      return;
    }

    if (action === "remove") {
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      return;
    }

    setProfiles((current) => current.map((item) => item.id === profile.id ? { ...item, status: action } : item));
  }

  function statusLabel(status: Profile["status"]) {
    return copy[status];
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-zinc-500">{copy.description}</p>
      </div>
      {message && <p className="mb-5 rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}
      {loading ? <p className="text-zinc-500">...</p> : profiles.length === 0 ? <p className="text-zinc-500">{copy.empty}</p> : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-200">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{profile.full_name || profile.email || profile.id}</p>
                  {profile.full_name && <p className="mt-1 text-sm text-zinc-500">{profile.email}</p>}
                  <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">{statusLabel(profile.status)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.status !== "active" && <button type="button" disabled={busyUserId === profile.id} onClick={() => void manageUser(profile, "active")} className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50">{copy.activate}</button>}
                  {profile.status !== "suspended" && <button type="button" disabled={busyUserId === profile.id} onClick={() => void manageUser(profile, "suspended")} className="rounded-md border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 disabled:opacity-50">{copy.suspend}</button>}
                  {profile.status !== "banned" && <button type="button" disabled={busyUserId === profile.id} onClick={() => void manageUser(profile, "banned")} className="rounded-md border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 disabled:opacity-50">{copy.ban}</button>}
                  <button type="button" disabled={busyUserId === profile.id} onClick={() => void manageUser(profile, "remove")} className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50">{copy.remove}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
