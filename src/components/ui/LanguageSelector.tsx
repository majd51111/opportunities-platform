"use client";
import { type ChangeEvent } from "react";

import { languageNames, type LanguageCode } from "@/languages";
import { useLanguage } from "@/providers/app-providers";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = event.target.value as LanguageCode;
    setLanguage(selected);
  }

  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
      <span aria-hidden="true" className="h-4 w-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-full w-full">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" />
        </svg>
      </span>
      <select value={language} onChange={handleChange} aria-label="Select language">
        {Object.keys(languageNames).map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}