"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Locale, TranslationKey } from "@/lib/i18n";
import { t as translate } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "udc-locale";

/**
 * Guarded storage access - see the matching note in ThemeContext. Browsers may
 * block storage for a third-party iframe, and a bare localStorage call throws
 * there, which would take down the whole embed from inside a provider effect.
 */
function readStoredLocale(): Locale | null {
  try {
    return localStorage.getItem(STORAGE_KEY) as Locale | null;
  } catch {
    return null;
  }
}

function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage unavailable - the locale still applies for this session.
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored === "en" || stored === "es") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeStoredLocale(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
