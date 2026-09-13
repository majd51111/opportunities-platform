"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";
import type { LanguageCode } from "@/languages";

type OpportunityForm = {
  title: string;
  shortDescription: string;
  description: string;
  directUrl: string;
  earnings: string;
  countries: string;
  devices: string;
  paymentMethods: string;
  requirements: string;
};

const emptyForm: OpportunityForm = {
  title: "",
  shortDescription: "",
  description: "",
  directUrl: "",
  earnings: "",
  countries: "",
  devices: "",
  paymentMethods: "",
  requirements: "",
};

function toList(value: string): string[] | null {
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

function createSlug(title: string): string {
  const normalized = title.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return `${normalized || "opportunity"}-${crypto.randomUUID().slice(0, 8)}`;
}

type SuggestionInputProps = {
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  listLabel: string;
  onChange: (value: string) => void;
};

function SuggestionInput({ value, options, placeholder, listLabel, onChange }: SuggestionInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayValue = value
    .split(",")
    .map((item) => {
      const option = options.find((candidate) => candidate.value === item.trim());
      return option?.label ?? item.trim();
    })
    .join(", ");
  const currentPart = displayValue.split(",").pop()?.trim().toLowerCase() ?? "";
  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.value}`.toLowerCase().includes(currentPart),
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function chooseOption(option: string) {
    const values = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (values.length === 0) {
      values.push(option);
    } else {
      values[values.length - 1] = option;
    }
    onChange(values.join(", "));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-11 overflow-hidden rounded-lg border border-zinc-300 bg-white transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100">
        <input
          value={displayValue}
          onChange={(event) => {
            const normalizedValue = event.target.value
              .split(",")
              .map((item) => {
                const option = options.find((candidate) => candidate.label.toLowerCase() === item.trim().toLowerCase());
                return option?.value ?? item.trim();
              })
              .join(", ");
            onChange(normalizedValue);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={listLabel}
          className="min-w-0 flex-1 border-0 px-3 py-2 font-normal outline-none"
        />
        <button
          type="button"
          aria-label={listLabel}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-11 shrink-0 items-center justify-center border-l border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-blue-50 hover:text-[#2563eb]"
        >
          <span className={`h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current transition-transform ${open ? "-translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5"}`} />
        </button>
      </div>
      {open && filteredOptions.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseOption(option.value)}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-blue-50 hover:text-[#1d4ed8]"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubmitOpportunityPage() {
  const { dir, language, t } = useLanguage();
  const [form, setForm] = useState<OpportunityForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const copy = getPageCopy(language).submit;
  const deviceNames: Record<LanguageCode, [string, string, string]> = {
    ar: ["كمبيوتر", "آيفون", "أندرويد"],
    en: ["Computer", "iPhone", "Android"],
    es: ["Ordenador", "iPhone", "Android"],
    fr: ["Ordinateur", "iPhone", "Android"],
    de: ["Computer", "iPhone", "Android"],
    pt: ["Computador", "iPhone", "Android"],
    ja: ["コンピューター", "iPhone", "Android"],
    zh: ["电脑", "iPhone", "Android"],
  };
  const [computer, iphone, android] = deviceNames[language];
  const deviceOptions = [
    { value: "Computer", label: computer },
    { value: "iPhone", label: iphone },
    { value: "Android", label: android },
    { value: "All devices", label: t.searchPage.allDevices },
  ];
  const paymentMethodOptions = [
    { value: "Bank account", label: t.profilePage.bankAccount },
    { value: "PayPal", label: t.profilePage.paypal },
    { value: "Payoneer", label: t.profilePage.payoneer },
    { value: "Cryptocurrency", label: t.profilePage.cryptocurrency },
  ];

  function updateField(field: keyof OpportunityForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    let directUrl: URL;
    try {
      directUrl = new URL(form.directUrl.trim());
      if (!['http:', 'https:'].includes(directUrl.protocol)) throw new Error();
    } catch {
      setMessage(copy.invalidUrl);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage(copy.loginRequired);
      return;
    }

    setSaving(true);
    const { data: opportunityId, error } = await supabase.rpc("submit_opportunity", {
      p_title: form.title.trim(),
      p_slug: createSlug(form.title),
      p_short_description: form.shortDescription.trim(),
      p_description: form.description.trim(),
      p_direct_url: directUrl.toString(),
      p_earnings_text: form.earnings.trim() || null,
      p_countries: toList(form.countries),
      p_devices: toList(form.devices),
      p_payment_methods: toList(form.paymentMethods),
      p_requirements: toList(form.requirements),
    });
    if (error) {
      setSaving(false);
      setMessage(`${copy.error} ${error.message}`);
      return;
    }

    try {
      const translationResponse = await fetch("/api/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          shortDescription: form.shortDescription.trim(),
          description: form.description.trim(),
          earningsText: form.earnings.trim() || null,
          countries: toList(form.countries),
          devices: toList(form.devices),
          paymentMethods: toList(form.paymentMethods),
          requirements: toList(form.requirements),
        }),
      });
      const translationPayload = await translationResponse.json() as {
        translations?: Record<string, { title: string; shortDescription: string; description: string; earningsText: string | null; countries: string[]; devices: string[]; paymentMethods: string[]; requirements: string[] }>;
      };

      if (translationResponse.ok && translationPayload.translations) {
        const translationRows = Object.entries(translationPayload.translations).map(([languageCode, translation]) => ({
          language_code: languageCode,
          title: translation.title,
          short_description: translation.shortDescription,
          description: translation.description,
          earnings_text: translation.earningsText,
          countries: translation.countries,
          devices: translation.devices,
          payment_methods: translation.paymentMethods,
          requirements: translation.requirements,
        }));
        const { error: translationSaveError } = await supabase.rpc("save_opportunity_translations", {
          p_opportunity_id: Number(opportunityId),
          p_translations: translationRows,
        });
        if (translationSaveError) {
          setSaving(false);
          setMessage(`${copy.success} لكن تعذر حفظ الترجمات: ${translationSaveError.message}`);
          setForm(emptyForm);
          return;
        }
      } else {
        setSaving(false);
        setMessage(`${copy.success} لكن تعذر إنشاء الترجمات: ${String((translationPayload as { error?: string }).error ?? "Translation provider error")}`);
        setForm(emptyForm);
        return;
      }
    } catch (translationError) {
      setSaving(false);
      setMessage(`${copy.success} لكن حدث خطأ أثناء الترجمة: ${translationError instanceof Error ? translationError.message : "Unknown error"}`);
      setForm(emptyForm);
      return;
    }

    setSaving(false);
    setMessage(copy.success);
    setForm(emptyForm);
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-3xl px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-zinc-500">{copy.description}</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium">{copy.name}<input required value={form.title} onChange={(event) => updateField("title", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">{copy.shortDescription}<input required value={form.shortDescription} onChange={(event) => updateField("shortDescription", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">{copy.details}<textarea required rows={5} value={form.description} onChange={(event) => updateField("description", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">{copy.link}<input required dir="ltr" type="url" value={form.directUrl} onChange={(event) => updateField("directUrl", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal text-left" /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">{copy.earnings}<input value={form.earnings} onChange={(event) => updateField("earnings", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">{copy.countries}<input value={form.countries} onChange={(event) => updateField("countries", event.target.value)} placeholder={copy.optional} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">{copy.devices}<SuggestionInput value={form.devices} options={deviceOptions} placeholder={copy.optional} listLabel={copy.devices} onChange={(value) => updateField("devices", value)} /></label>
            <label className="grid gap-2 text-sm font-medium">{copy.paymentMethods}<SuggestionInput value={form.paymentMethods} options={paymentMethodOptions} placeholder={copy.optional} listLabel={copy.paymentMethods} onChange={(value) => updateField("paymentMethods", value)} /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium">{copy.requirements}<textarea rows={3} value={form.requirements} onChange={(event) => updateField("requirements", event.target.value)} placeholder={copy.optional} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          {message && <p className="rounded-lg bg-[#f0efff] px-4 py-3 text-sm text-[#3b3971]">{message}</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{copy.submit}</button>
            <Link href="/opportunities" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-700">{copy.cancel}</Link>
          </div>
        </form>
      </section>
    </main>
  );
}