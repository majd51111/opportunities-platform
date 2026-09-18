"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";
import type { LanguageCode } from "@/languages";
import { getLocalizedText } from "@/types";

type OpportunityForm = {
  title: string;
  shortDescription: string;
  description: string;
  directUrl: string;
  earnings: string;
  category: string;
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
  category: "",
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
  const [selectedValues, setSelectedValues] = useState<string[]>(() => value.split(",").map((item) => item.trim()).filter(Boolean));
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmittedValue = useRef(value);
  const currentPart = inputValue.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    !selectedValues.includes(option.value) &&
    `${option.label} ${option.value}`.toLowerCase().includes(currentPart),
  );

  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      setSelectedValues(value.split(",").map((item) => item.trim()).filter(Boolean));
      setInputValue("");
      lastEmittedValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function emitValues(values: string[], pendingValue = "") {
    const uniqueValues = values.map((item) => item.trim()).filter((item, index, items) => item && items.indexOf(item) === index);
    const nextValue = [...uniqueValues, pendingValue].filter((item) => item.trim()).join(", ");
    setSelectedValues(uniqueValues);
    setInputValue(pendingValue);
    lastEmittedValue.current = nextValue;
    onChange(nextValue);
  }

  function chooseOption(option: string) {
    const nextValues = [...selectedValues, option].filter((item, index, values) => values.indexOf(item) === index);
    emitValues(nextValues);
    setOpen(false);
  }

  function removeValue(valueToRemove: string) {
    emitValues(selectedValues.filter((item) => item !== valueToRemove), inputValue);
  }

  function addTypedValue() {
    if (!inputValue.trim()) return;
    emitValues([...selectedValues, inputValue]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="rounded-xl border border-zinc-300 bg-white px-2.5 py-2 transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100">
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedValues.map((selectedValue) => {
              const option = options.find((candidate) => candidate.value === selectedValue);
              return (
                <span key={selectedValue} className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {option?.label ?? selectedValue}
                  <button
                    type="button"
                    aria-label={`${listLabel}: ${selectedValue}`}
                    onClick={() => removeValue(selectedValue)}
                    className="rounded-full px-0.5 text-blue-500 transition hover:bg-blue-100 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <input
            value={inputValue}
            onChange={(event) => {
              const parts = event.target.value.split(",");
              const typedValues = parts.slice(0, -1).map((item) => item.trim()).filter(Boolean);
              const nextInputValue = parts.at(-1) ?? "";
              emitValues([...selectedValues, ...typedValues], nextInputValue);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && inputValue.trim()) {
                event.preventDefault();
                const matchingOption = options.find((option) => option.value.toLowerCase() === inputValue.trim().toLowerCase());
                if (matchingOption) chooseOption(matchingOption.value);
                else addTypedValue();
              }
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label={listLabel}
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-sm font-normal outline-none placeholder:text-zinc-400"
          />
          <button
            type="button"
            aria-label={`${listLabel}: add custom value`}
            onClick={addTypedValue}
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 px-4 text-xl font-bold leading-none text-blue-700 shadow-sm transition hover:bg-blue-200"
          >
            +
          </button>
          <button
            type="button"
            aria-label={listLabel}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 transition hover:bg-blue-50 hover:text-[#2563eb]"
          >
            <span className={`h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-current transition-transform ${open ? "-translate-y-0.5 rotate-[225deg]" : "-translate-y-0.5"}`} />
          </button>
        </div>
      </div>
      {open && filteredOptions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-44 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                chooseOption(option.value);
              }}
              className="flex min-h-10 w-full touch-manipulation items-center rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-blue-50 hover:text-[#1d4ed8] focus-visible:bg-blue-50 focus-visible:outline-none"
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
  const [categories, setCategories] = useState<{ id: number; name: unknown }[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const copy = getPageCopy(language).submit;
  useEffect(() => {
    async function loadCategories() {
      const { data } = await getSupabaseBrowserClient()
        .from("categories")
        .select("id, name")
        .order("id", { ascending: true });
      setCategories(data ?? []);
    }

    void loadCategories();
  }, []);
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
  const categoryOptions = categories.map((category) => ({
    id: String(category.id),
    label: getLocalizedText(category.name, language, "en") ?? String(category.name ?? ""),
  }));

  function updateField(field: keyof OpportunityForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCategory(value: string) {
    const matchingCategory = categoryOptions.find((category) => category.label.toLowerCase() === value.trim().toLowerCase());
    setCategoryId(matchingCategory?.id ?? "");
    updateField("category", value);
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
      p_category_id: categoryId ? Number(categoryId) : null,
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
          setCategoryId("");
          return;
        }
      } else {
        setSaving(false);
        setMessage(`${copy.success} لكن تعذر إنشاء الترجمات: ${String((translationPayload as { error?: string }).error ?? "Translation provider error")}`);
        setForm(emptyForm);
        setCategoryId("");
        return;
      }
    } catch (translationError) {
      setSaving(false);
      setMessage(`${copy.success} لكن حدث خطأ أثناء الترجمة: ${translationError instanceof Error ? translationError.message : "Unknown error"}`);
      setForm(emptyForm);
      setCategoryId("");
      return;
    }

    setSaving(false);
    setMessage(copy.success);
    setForm(emptyForm);
    setCategoryId("");
  }

  return (
    <main dir={dir} className="mx-auto w-full max-w-3xl px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-zinc-500">{copy.description}</p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium">{copy.name}<input required value={form.title} onChange={(event) => updateField("title", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">{copy.details}<textarea rows={5} value={form.description} onChange={(event) => updateField("description", event.target.value)} className="rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">{copy.link}<input required dir="ltr" type="url" value={form.directUrl} onChange={(event) => updateField("directUrl", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal text-left" /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">{copy.earnings}<input value={form.earnings} onChange={(event) => updateField("earnings", event.target.value)} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">{copy.category}<input list="opportunity-categories" value={form.category} onChange={(event) => updateCategory(event.target.value)} placeholder={copy.optional} className="h-11 rounded-lg border border-zinc-300 px-3 py-2 font-normal" /><datalist id="opportunity-categories">{categoryOptions.map((category) => <option key={category.id} value={category.label} />)}</datalist></label>
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