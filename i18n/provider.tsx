"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  resources,
} from "./config";
import type {
  AppLocale,
  I18nProviderProps,
  LocalePreferenceContextValue,
} from "@/types/I18n";

const LocalePreferenceContext = createContext<LocalePreferenceContextValue | null>(null);

export function AppI18nProvider({
  children,
  initialLocale,
  hasLocaleCookie: initialHasLocaleCookie,
}: I18nProviderProps) {
  const [hasLocaleCookie, setHasLocaleCookie] = useState(initialHasLocaleCookie);
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.use(initReactI18next).init({
      resources,
      lng: initialLocale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: ["pt-BR", "en"],
      defaultNS: "translation",
      interpolation: { escapeValue: false },
      initAsync: false,
      returnNull: false,
    });
    return instance;
  });
  const markLocaleCookiePresent = useCallback(() => setHasLocaleCookie(true), []);
  const preference = useMemo(
    () => ({ hasLocaleCookie, markLocaleCookiePresent }),
    [hasLocaleCookie, markLocaleCookiePresent],
  );

  return (
    <LocalePreferenceContext.Provider value={preference}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocalePreferenceContext.Provider>
  );
}

export function useSessionLocale(preferredLocale: unknown) {
  const context = useLocalePreference();
  const appliedSessionLocale = useRef(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale = normalizeLocale(preferredLocale);

    if (appliedSessionLocale.current || context.hasLocaleCookie || !locale) {
      return;
    }

    appliedSessionLocale.current = true;
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    writeLocaleCookie(locale);
    context.markLocaleCookiePresent();
  }, [context, i18n, preferredLocale]);
}

export function useLocalePreference() {
  const context = useContext(LocalePreferenceContext);

  if (!context) {
    throw new Error("useLocalePreference must be used inside AppI18nProvider");
  }

  return context;
}

export function writeLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
