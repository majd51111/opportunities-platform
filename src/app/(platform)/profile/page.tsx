"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getLocalizedText } from "@/types";

type AccountType = "bank_account" | "paypal" | "payoneer" | "cryptocurrency";
type PaymentAccount = { id: string; account_type: AccountType; account_holder_name: string | null; bank_name: string | null; iban: string | null; account_number: string | null; swift_bic: string | null; paypal_email: string | null; payoneer_email: string | null; wallet_address: string | null; network: string | null };
type AccountForm = Omit<PaymentAccount, "id">;
type NotificationPreferences = { email_notifications: boolean; opportunity_updates: boolean; marketing_notifications: boolean };
type StartedOpportunity = { id: string | number; title: unknown; slug: string; status: string | null };

const emptyAccount: AccountForm = { account_type: "bank_account", account_holder_name: "", bank_name: "", iban: "", account_number: "", swift_bic: "", paypal_email: "", payoneer_email: "", wallet_address: "", network: "" };
const defaultNotificationPreferences: NotificationPreferences = { email_notifications: true, opportunity_updates: true, marketing_notifications: false };

function isValidIban(value: string): boolean {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const numeric = `${iban.slice(4)}${iban.slice(0, 4)}`.split("").map((character) => { const code = character.charCodeAt(0); return code >= 65 && code <= 90 ? String(code - 55) : character; }).join("");
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

function maskSensitive(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  return normalized.length <= 4 ? "****" : `**** ${normalized.slice(-4)}`;
}

function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  return local && domain ? `${local.slice(0, 2)}***@${domain}` : maskSensitive(value);
}

function maskPhoneOrWallet(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  return normalized.length <= 4 ? "****" : `${normalized.slice(0, 2)}${"*".repeat(Math.max(3, normalized.length - 4))}${normalized.slice(-2)}`;
}

export default function ProfilePage() {
  const { t, dir, language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPath, setAvatarPath] = useState("");
  const [editProfile, setEditProfile] = useState(false);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [notifications, setNotifications] = useState(defaultNotificationPreferences);
  const [startedOpportunities, setStartedOpportunities] = useState<StartedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [message, setMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [error, setError] = useState("");

  async function deleteAccount() {
    if (!user || !window.confirm(t.profilePage.deleteAccountConfirmation)) return;

    setMessage("");
    const { error: deleteError } = await getSupabaseBrowserClient().rpc("delete_my_account");
    if (deleteError) {
      setMessage(t.profilePage.deleteAccountError);
      return;
    }

    await getSupabaseBrowserClient().auth.signOut();
    window.location.assign("/");
  }

  async function loadAccounts(userId: string) {
    setLoadingAccounts(true);
    const { data, error: loadError } = await getSupabaseBrowserClient().from("payout_details").select("id, account_type, account_holder_name, bank_name, iban, account_number, swift_bic, paypal_email, payoneer_email, wallet_address, network").eq("user_id", userId).order("created_at", { ascending: false });
    setLoadingAccounts(false);
    if (loadError) { setError(t.profilePage.bankAccountError); return; }
    setAccounts((data ?? []) as PaymentAccount[]);
  }

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
      if (!authenticatedUser) { setError(t.profilePage.loginRequired); setLoading(false); return; }
      setUser(authenticatedUser);
      setEmail(authenticatedUser.email ?? "");
      setFullName(authenticatedUser.user_metadata?.full_name ?? authenticatedUser.user_metadata?.name ?? "");
      const storedAvatarPath = authenticatedUser.user_metadata?.avatar_path ?? "";
      setAvatarPath(storedAvatarPath);
      if (storedAvatarPath) { const { data: signedAvatar } = await supabase.storage.from("avatars").createSignedUrl(storedAvatarPath, 3600); setAvatarUrl(signedAvatar?.signedUrl ?? ""); }
      const [preferencesResult, eventsResult] = await Promise.all([
        supabase.from("notification_preferences").select("email_notifications, opportunity_updates, marketing_notifications").eq("user_id", authenticatedUser.id).maybeSingle(),
        supabase.from("opportunity_events").select("id, opportunity_id, event_type, created_at").eq("user_id", authenticatedUser.id).eq("event_type", "started").order("created_at", { ascending: false }),
      ]);
      await loadAccounts(authenticatedUser.id);
      if (!preferencesResult.error && preferencesResult.data) setNotifications(preferencesResult.data as NotificationPreferences);
      if (!eventsResult.error && eventsResult.data?.length) {
        const { data: opportunities } = await supabase.from("opportunities").select("id, title, slug, status").in("id", eventsResult.data.map((event) => event.opportunity_id));
        const byId = new Map((opportunities ?? []).map((opportunity) => [String(opportunity.id), opportunity]));
        setStartedOpportunities(eventsResult.data.flatMap((event) => { const opportunity = byId.get(String(event.opportunity_id)); return opportunity ? [opportunity as StartedOpportunity] : []; }));
      }
      setLoading(false);
    }
    loadProfile();
  }, [t.profilePage.bankAccountError, t.profilePage.loginRequired]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSavingProfile(true);
    const { data, error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ data: { full_name: fullName.trim(), avatar_path: avatarPath || null } });
    setSavingProfile(false);
    if (updateError) { setMessage(t.profilePage.profileUpdateError); return; }
    setUser(data.user); setEditProfile(false); setMessage(t.profilePage.profileUpdated);
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !user) return;
    setMessage("");
    const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
    const supabase = getSupabaseBrowserClient();
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setMessage(t.profilePage.avatarUploadError); return; }
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: path } });
    if (updateError) { setMessage(t.profilePage.avatarUploadError); return; }
    if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
    const { data: signedAvatar } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarPath(path); setAvatarUrl(signedAvatar?.signedUrl ?? ""); setMessage(t.profilePage.profileUpdated);
  }

  function openAddAccount() { setEditingAccountId(null); setAccountForm({ ...emptyAccount }); setAccountMessage(""); setAccountFormOpen(true); }
  function openEditAccount(account: PaymentAccount) { setEditingAccountId(account.id); setAccountForm({ ...account }); setAccountMessage(""); setAccountFormOpen(true); }

  async function saveBankAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setAccountMessage("");
    const form = { user_id: user.id, account_type: accountForm.account_type, account_holder_name: accountForm.account_holder_name?.trim() || null, bank_name: accountForm.bank_name?.trim() || null, iban: accountForm.iban?.replace(/\s+/g, "").toUpperCase() || null, account_number: accountForm.account_number?.trim() || null, swift_bic: accountForm.swift_bic?.trim().toUpperCase() || null, paypal_email: accountForm.paypal_email?.trim().toLowerCase() || null, payoneer_email: accountForm.payoneer_email?.trim().toLowerCase() || null, wallet_address: accountForm.wallet_address?.trim() || null, network: accountForm.network || null, updated_at: new Date().toISOString() };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (accountForm.account_type === "bank_account" && (!form.account_holder_name || !form.bank_name || !form.account_number || !form.swift_bic)) { setAccountMessage(t.profilePage.requiredFields); return; }
    if (accountForm.account_type === "bank_account" && form.iban && !isValidIban(form.iban)) { setAccountMessage(t.profilePage.invalidIban); return; }
    if (accountForm.account_type === "paypal" && (!form.paypal_email || !emailPattern.test(form.paypal_email))) { setAccountMessage(t.profilePage.invalidEmail); return; }
    if (accountForm.account_type === "payoneer" && (!form.payoneer_email || !emailPattern.test(form.payoneer_email))) { setAccountMessage(t.profilePage.invalidEmail); return; }
    if (accountForm.account_type === "cryptocurrency" && (!form.wallet_address || !form.network)) { setAccountMessage(t.profilePage.requiredFields); return; }
    setSavingAccount(true);
    const supabase = getSupabaseBrowserClient();
    const query = editingAccountId ? supabase.from("payout_details").update(form).eq("id", editingAccountId).eq("user_id", user.id) : supabase.from("payout_details").insert(form);
    const { error: saveError } = await query;
    setSavingAccount(false);
    if (saveError) { setAccountMessage(t.profilePage.bankAccountError); return; }
    await loadAccounts(user.id); setAccountFormOpen(false); setAccountMessage(editingAccountId ? t.profilePage.accountUpdated : t.profilePage.accountSaved);
  }

  async function deleteBankAccount() {
    if (!user || !editingAccountId || !window.confirm(t.profilePage.deleteConfirmation)) return;
    const { error: deleteError } = await getSupabaseBrowserClient().from("payout_details").delete().eq("id", editingAccountId).eq("user_id", user.id);
    if (deleteError) { setAccountMessage(t.profilePage.bankAccountError); return; }
    await loadAccounts(user.id); setAccountFormOpen(false); setAccountMessage(t.profilePage.accountDeleted);
  }

  async function updateNotifications(key: keyof NotificationPreferences, value: boolean) {
    if (!user) return;
    const previous = notifications; const next = { ...notifications, [key]: value }; setNotifications(next); setNotificationMessage("");
    const { error: saveError } = await getSupabaseBrowserClient().from("notification_preferences").upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (saveError) { setNotifications(previous); setNotificationMessage(t.profilePage.notificationSaveError); }
  }

  if (loading) return <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16"><p className="text-zinc-500">{t.profilePage.loading}</p></main>;
  if (error || !user) return <main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-16"><p className="text-red-600">{error}</p></main>;

  const accountLabels: Record<AccountType, string> = { bank_account: t.profilePage.bankAccount, paypal: t.profilePage.paypal, payoneer: t.profilePage.payoneer, cryptocurrency: t.profilePage.cryptocurrency };
  const accountOptions: [AccountType, string][] = [["bank_account", t.profilePage.bankAccount], ["paypal", t.profilePage.paypal], ["payoneer", t.profilePage.payoneer], ["cryptocurrency", t.profilePage.cryptocurrency]];

  return <><style>{`
    [role="dialog"] {
      box-sizing: border-box;
      overflow: hidden;
    }
    [role="dialog"] > div {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      max-width: 640px;
    }
    [role="dialog"] form {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
      max-height: none !important;
      overflow: visible !important;
    }
    [role="dialog"] form > div {
      display: grid;
      flex: 1 1 auto;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem 1rem;
    }
    [role="dialog"] form > div > label {
      min-width: 0;
    }
    [role="dialog"] form > div > div:last-child {
      grid-column: 1 / -1;
      flex-shrink: 0;
      margin-top: auto;
      width: 100%;
      align-items: center;
      justify-content: space-between;
    }
    [role="dialog"] form > div > div:last-child > div:last-child {
      display: contents;
    }
    @media (max-width: 640px), (max-height: 700px) {
      [role="dialog"] > div {
        max-height: calc(100vh - 32px);
      }
      [role="dialog"] form {
        flex: 1 1 auto;
        max-height: none !important;
        overflow-y: auto !important;
        overscroll-behavior: contain;
      }
      [role="dialog"] form > div {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (min-width: 641px) and (min-height: 701px) {
      [role="dialog"] form {
        max-height: none !important;
        overflow: visible !important;
      }
    }
  `}</style><main dir={dir} className="mx-auto w-full max-w-5xl px-6 py-6">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">{t.profilePage.title}</h1><p className="mt-2 text-zinc-500">{t.profilePage.profileInformation}</p></div></div>
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2"><div className="flex flex-col gap-5 sm:flex-row sm:items-center">{avatarUrl ? <img src={avatarUrl} alt={fullName || t.profilePage.title} className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-500">{(fullName || email).charAt(0).toUpperCase()}</div>}<div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{fullName || email}</h2><p className="mt-1 break-all text-zinc-500">{email}</p></div>{!editProfile && <button type="button" onClick={() => setEditProfile(true)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium">{t.profilePage.editProfile}</button>}</div>{editProfile && <form id="profile-form" onSubmit={saveProfile} className="mt-6 grid gap-4 border-t border-zinc-100 pt-6"><label className="grid gap-2 text-sm font-medium">{t.profilePage.fullName}<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label><label className="grid gap-2 text-sm font-medium">{t.profilePage.email}<input value={email} readOnly className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-normal text-zinc-500" /></label><label className="grid gap-2 text-sm font-medium">{t.profilePage.editProfile}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label></form>}{message && <p className="mt-4 text-sm text-zinc-600">{message}</p>}</section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">{t.profilePage.notifications}</h2><div className="mt-5 grid gap-4 text-sm">{([['email_notifications', t.profilePage.emailNotifications], ['opportunity_updates', t.profilePage.opportunityUpdates], ['marketing_notifications', t.profilePage.marketingNotifications]] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4"><span>{label}</span><input type="checkbox" checked={notifications[key]} onChange={(event) => updateNotifications(key, event.target.checked)} className="h-4 w-4" /></label>)}</div>{notificationMessage && <p className="mt-4 text-sm text-red-600">{notificationMessage}</p>}</section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">{t.profilePage.favorites}</h2><p className="mt-2 text-sm text-zinc-500">{t.profilePage.favoritesDescription}</p><Link href="/favorites" className="mt-5 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">{t.profilePage.viewFavorites}</Link></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2"><h2 className="text-xl font-semibold">{t.profilePage.startedOpportunities}</h2>{startedOpportunities.length === 0 ? <p className="mt-4 text-sm text-zinc-500">{t.profilePage.noStartedOpportunities}</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{startedOpportunities.map((opportunity) => <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`} className="rounded-lg border border-zinc-200 p-4 hover:border-zinc-400"><p className="font-medium">{getLocalizedText(opportunity.title, language, "en") ?? t.profilePage.viewOpportunity}</p>{opportunity.status && <p className="mt-1 text-sm text-zinc-500">{opportunity.status}</p>}</Link>)}</div>}</section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{t.profilePage.payoutAccounts}</h2></div>{loadingAccounts ? <p className="mt-4 text-sm text-zinc-500">{t.profilePage.loading}</p> : accounts.length === 0 ? <p className="mt-4 text-sm text-zinc-500">{t.profilePage.payoutAccountsEmpty}</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{accounts.map((account) => <div key={account.id} className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold">{accountLabels[account.account_type].slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="font-medium">{accountLabels[account.account_type]}</p><p className="truncate text-sm text-zinc-500">{account.account_type === "bank_account" ? `${account.bank_name ?? ""} · ${maskSensitive(account.iban || account.account_number || "")}` : account.account_type === "paypal" ? maskEmail(account.paypal_email ?? "") : account.account_type === "payoneer" ? maskEmail(account.payoneer_email ?? "") : `${account.network ?? ""} · ${maskPhoneOrWallet(account.wallet_address ?? "")}`}</p></div><button type="button" onClick={() => openEditAccount(account)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">{t.profilePage.editAccount}</button></div>)}</div>}{accountMessage && <p className="mt-4 text-sm text-zinc-600">{accountMessage}</p>}<div dir="ltr" className="mt-5 flex justify-end"><button type="button" onClick={openAddAccount} className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"><span aria-hidden="true">+</span>{t.profilePage.addAccount}</button></div></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2"><div className="flex flex-wrap items-center justify-end gap-3">{editProfile && <button type="submit" form="profile-form" disabled={savingProfile} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{t.profilePage.saveChanges}</button>}<button type="button" onClick={() => window.location.assign("/opportunities")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium">{t.profilePage.cancel}</button><button type="button" onClick={deleteAccount} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">{t.profilePage.deleteAccount}</button></div></section>
    </div>
    {accountFormOpen && <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" dir={dir}><div className="flex max-h-[calc(100vh-32px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl"><div className="relative flex shrink-0 items-center justify-center gap-4 pr-8"><h2 id="account-dialog-title" className="text-xl font-semibold">{editingAccountId ? t.profilePage.editAccount : t.profilePage.addAccount}</h2><button type="button" onClick={() => setAccountFormOpen(false)} aria-label={t.profilePage.cancel} className="absolute left-0 top-0 text-2xl leading-none text-zinc-500">×</button></div><form onSubmit={saveBankAccount} className="mt-5 min-h-0 max-h-[calc(100vh-152px)] overflow-y-auto overscroll-contain px-1"><div className="grid gap-4"><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.accountType}<select value={accountForm.account_type} onChange={(event) => setAccountForm({ ...emptyAccount, account_type: event.target.value as AccountType })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal">{accountOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{accountForm.account_type === "bank_account" && <><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.accountHolderName}<input required value={accountForm.account_holder_name ?? ""} onChange={(event) => setAccountForm({ ...accountForm, account_holder_name: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.bankName}<input required value={accountForm.bank_name ?? ""} onChange={(event) => setAccountForm({ ...accountForm, bank_name: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.iban}<input dir="ltr" value={accountForm.iban ?? ""} onChange={(event) => setAccountForm({ ...accountForm, iban: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal text-left" /></label><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.accountNumber}<input required value={accountForm.account_number ?? ""} onChange={(event) => setAccountForm({ ...accountForm, account_number: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.swiftBic}<input required value={accountForm.swift_bic ?? ""} onChange={(event) => setAccountForm({ ...accountForm, swift_bic: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label></>}{accountForm.account_type === "paypal" && <label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.paypalEmail}<input required type="email" value={accountForm.paypal_email ?? ""} onChange={(event) => setAccountForm({ ...accountForm, paypal_email: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>}{accountForm.account_type === "payoneer" && <label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.payoneerEmail}<input required type="email" value={accountForm.payoneer_email ?? ""} onChange={(event) => setAccountForm({ ...accountForm, payoneer_email: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>}{accountForm.account_type === "cryptocurrency" && <><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.walletAddress}<input required dir="ltr" value={accountForm.wallet_address ?? ""} onChange={(event) => setAccountForm({ ...accountForm, wallet_address: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal text-left" /></label><label className="grid w-full gap-2 text-start text-sm font-medium">{t.profilePage.network}<select required value={accountForm.network ?? ""} onChange={(event) => setAccountForm({ ...accountForm, network: event.target.value })} className="h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal"><option value="">{t.profilePage.selectNetwork}</option>{["Bitcoin", "Ethereum", "Tron", "Solana", "Polygon"].map((network) => <option key={network} value={network}>{network}</option>)}</select></label></>}{accountMessage && <p className="text-sm text-red-600">{accountMessage}</p>}<div className="flex shrink-0 flex-wrap justify-between gap-3 pt-2"><div>{editingAccountId && <button type="button" onClick={deleteBankAccount} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600">{t.profilePage.deleteAccount}</button>}</div><div className="flex flex-row gap-3" dir="ltr"><button type="button" onClick={() => setAccountFormOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium">{t.profilePage.cancel}</button><button disabled={savingAccount} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">{t.profilePage.saveAccount}</button></div></div></div></form></div></div>}
  </main></>;
}

