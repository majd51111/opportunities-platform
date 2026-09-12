"use client";

import { useEffect } from "react";

import { languages, type LanguageCode } from "@/languages";

const STORAGE_KEY = "selected-language";

export default function LanguageSync() {
  useEffect(() => {
    const applyLanguage = (language?: string) => {
      const selected = (language ?? localStorage.getItem(STORAGE_KEY) ?? "en") as LanguageCode;

      if (!(selected in languages)) {
        return;
      }

      document.documentElement.lang = selected;
      document.documentElement.dir = selected === "ar" ? "rtl" : "ltr";
    };

    applyLanguage();

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<LanguageCode>;
      applyLanguage(customEvent.detail);
    };

    window.addEventListener("language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("language-change", handleLanguageChange);
    };
  }, []);

  return null;
}