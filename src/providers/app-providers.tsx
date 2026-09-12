"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { languages, type LanguageCode, type LanguageDictionary } from "@/languages";

const STORAGE_KEY = "selected-language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (nextLanguage: LanguageCode) => void;
  dir: "ltr" | "rtl";
  isRtl: boolean;
  t: LanguageDictionary;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    const initialLanguage = saved && saved in languages ? saved : "en";

    setLanguageState(initialLanguage);
    document.documentElement.lang = initialLanguage;
    document.documentElement.dir = initialLanguage === "ar" ? "rtl" : "ltr";
  }, []);

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(
      new CustomEvent("language-change", {
        detail: nextLanguage,
      })
    );
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    dir: language === "ar" ? "rtl" : "ltr",
    isRtl: language === "ar",
    t: languages[language] as LanguageDictionary,
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside AppProviders");
  }

  return context;
}
