"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

type Profile = { id: string; email: string | null; full_name: string | null };
type Role = { user_id: string; role: "admin" | "support" };
type SupportPermission = { user_id: string; can_review_opportunities: boolean; can_manage_reports: boolean; can_manage_support_requests: boolean };
type PermissionName = "review_opportunities" | "manage_reports" | "manage_support_requests";

export default function AdminSupportPage() {
  const { dir, language } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<SupportPermission[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState("");
  const copy = getPageCopy(language).supportTeam;

  useEffect(() => {
    async function loadSupportTeam() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage(copy.access); setLoading(false); return; }
      const { data: currentRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (currentRole?.role !== "admin") { setMessage(copy.access); setLoading(false); return; }
      const [profileResult, roleResult, permissionResult] = await Promise.all([
        supabase.from("user_profiles").select("id, email, full_name").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("support_permissions").select("user_id, can_review_opportunities, can_manage_reports, can_manage_support_requests"),
      ]);
      setLoading(false);
      if (profileResult.error || roleResult.error || permissionResult.error) { setMessage(copy.error); return; }
      setProfiles((profileResult.data ?? []) as Profile[]);
      setRoles((roleResult.data ?? []) as Role[]);
      setPermissions((permissionResult.data ?? []) as SupportPermission[]);
    }

    void loadSupportTeam();
  }, [copy.access, copy.error]);

  async function setSupportAccess(userId: string, enabled: boolean) {
    setUpdatingKey(`${userId}:membership`); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("set_support_access", { p_user_id: userId, p_enabled: enabled });
    setUpdatingKey("");
    if (error) { setMessage(copy.error); return; }
    setRoles((current) => enabled ? [...current.filter((role) => role.user_id !== userId), { user_id: userId, role: "support" }] : current.filter((role) => role.user_id !== userId));
    if (enabled) setPermissions((current) => [...current.filter((permission) => permission.user_id !== userId), { user_id: userId, can_review_opportunities: false, can_manage_reports: false, can_manage_support_requests: false }]);
    else setPermissions((current) => current.filter((permission) => permission.user_id !== userId));
  }

  async function setPermission(userId: string, permission: PermissionName, enabled: boolean) {
    setUpdatingKey(`${userId}:${permission}`); setMessage("");
    const { error } = await getSupabaseBrowserClient().rpc("set_support_permission", { p_user_id: userId, p_permission: permission, p_enabled: enabled });
    setUpdatingKey("");
    if (error) { setMessage(copy.error); return; }
    setPermissions((current) => current.map((item) => item.user_id === userId ? { ...item, ...(permission === "review_opportunities" ? { can_review_opportunities: enabled } : permission === "manage_reports" ? { can_manage_reports: enabled } : { can_manage_support_requests: enabled }) } : item));
  }

  return <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-12"><div className="mb-8"><h1 className="text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-zinc-500">{copy.description}</p></div>{message && <p className="mb-5 rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}{loading ? <p className="text-zinc-500">...</p> : <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white"><div className="divide-y divide-zinc-200">{profiles.map((profile) => { const role = roles.find((item) => item.user_id === profile.id)?.role; const isAdmin = role === "admin"; const isSupport = role === "support"; const permission = permissions.find((item) => item.user_id === profile.id); return <div key={profile.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="font-medium">{profile.full_name || profile.email || profile.id}</p>{profile.full_name && <p className="mt-1 text-sm text-zinc-500">{profile.email}</p>}</div>{isAdmin ? <span className="rounded-full bg-[#f0efff] px-3 py-1 text-sm font-medium text-[#4c3ecb]">{copy.admin}</span> : <button type="button" disabled={updatingKey === `${profile.id}:membership`} onClick={() => void setSupportAccess(profile.id, !isSupport)} className={isSupport ? "inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60" : "inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"}>{isSupport ? copy.revoke : copy.grant}</button>}</div>{isSupport && <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-3"><label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"><span>{copy.opportunities}</span><input type="checkbox" checked={permission?.can_review_opportunities ?? false} disabled={updatingKey === `${profile.id}:review_opportunities`} onChange={(event) => void setPermission(profile.id, "review_opportunities", event.target.checked)} className="h-4 w-4 accent-[#2563eb]" /></label><label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"><span>{copy.reports}</span><input type="checkbox" checked={permission?.can_manage_reports ?? false} disabled={updatingKey === `${profile.id}:manage_reports`} onChange={(event) => void setPermission(profile.id, "manage_reports", event.target.checked)} className="h-4 w-4 accent-[#2563eb]" /></label><label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"><span>{copy.requests}</span><input type="checkbox" checked={permission?.can_manage_support_requests ?? false} disabled={updatingKey === `${profile.id}:manage_support_requests`} onChange={(event) => void setPermission(profile.id, "manage_support_requests", event.target.checked)} className="h-4 w-4 accent-[#2563eb]" /></label></div>}</div>; })}</div></div>}</main>;
}
