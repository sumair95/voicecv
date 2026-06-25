"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Language } from "@/types/cv";
import { dirFor, tr } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Language;
  dir: "ltr" | "rtl";
  setLang: (next: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "voicecv-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      (localStorage.getItem(STORAGE_KEY) as Language | null)) || null;
    if (
      stored === "ar" ||
      stored === "en" ||
      stored === "ur" ||
      stored === "it"
    ) {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const value: LanguageContextValue = {
    lang,
    dir: dirFor(lang),
    setLang,
    t: (key, vars) => tr(key, lang, vars),
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
