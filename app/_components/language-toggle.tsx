"use client";

import { useTranslation } from "react-i18next";
import { normalizeLocale } from "@/i18n/config";
import { useLocalePreference, writeLocaleCookie } from "@/i18n/provider";
import type { AppLocale, LanguageToggleProps } from "@/types/I18n";

export function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { i18n, t } = useTranslation();
  const { markLocaleCookiePresent } = useLocalePreference();
  const currentLocale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const targetLocale: AppLocale = currentLocale === "pt-BR" ? "en" : "pt-BR";

  function changeLanguage() {
    void i18n.changeLanguage(targetLocale);
    document.documentElement.lang = targetLocale;
    writeLocaleCookie(targetLocale);
    markLocaleCookiePresent();
  }

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {t("language.label")}
      </span>
      <button
        aria-checked={currentLocale === "en"}
        aria-label={t("language.control")}
        className="relative inline-flex h-9 w-[5.25rem] shrink-0 items-center justify-between rounded-full border border-slate-300 bg-slate-100 px-1 py-0.5 text-base outline-none transition hover:border-teal-500 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        onClick={changeLanguage}
        role="switch"
        title={t("language.switchTo")}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-1 size-8 rounded-full bg-white shadow-sm ring-1 ring-slate-300 transition-transform duration-200 ${
            currentLocale === "en" ? "translate-x-11" : "translate-x-0"
          }`}
        />
        <span
          aria-hidden="true"
          className={`relative z-10 grid size-8 place-items-center transition-opacity ${
            currentLocale === "pt-BR" ? "opacity-100" : "opacity-45"
          }`}
          title={t("language.brazil")}
        >
          🇧🇷
        </span>
        <span
          aria-hidden="true"
          className={`relative z-10 grid size-8 place-items-center transition-opacity ${
            currentLocale === "en" ? "opacity-100" : "opacity-45"
          }`}
          title={t("language.unitedStates")}
        >
          🇺🇸
        </span>
        <span className="sr-only">
          {currentLocale === "pt-BR"
            ? t("language.currentPortuguese")
            : t("language.currentEnglish")}
        </span>
      </button>
    </div>
  );
}
