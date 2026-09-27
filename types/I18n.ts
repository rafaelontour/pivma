import type { ReactNode } from "react";

export type AppLocale = "pt-BR" | "en";

export type I18nProviderProps = {
  children: ReactNode;
  initialLocale: AppLocale;
  hasLocaleCookie: boolean;
};

export type LanguageToggleProps = {
  className?: string;
};

export type LocalePreferenceContextValue = {
  hasLocaleCookie: boolean;
  markLocaleCookiePresent: () => void;
};

export type LocalizedFormatOptions = {
  locale: AppLocale;
};

export type LocalizedDateFormatOptions = LocalizedFormatOptions &
  Intl.DateTimeFormatOptions;

export type LocalizedNumberFormatOptions = LocalizedFormatOptions &
  Intl.NumberFormatOptions;

