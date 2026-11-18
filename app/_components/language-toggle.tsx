"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Languages } from "lucide-react";
import { normalizeLocale } from "@/i18n/config";
import { useLocalePreference, writeLocaleCookie } from "@/i18n/provider";
import type { AppLocale, LanguageToggleProps } from "@/types/I18n";

export function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { i18n, t } = useTranslation();
  const { markLocaleCookiePresent } = useLocalePreference();
  const currentLocale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    containerRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')
      ?.focus();

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function changeLanguage(locale: AppLocale) {
    setIsOpen(false);
    triggerRef.current?.focus();
    if (locale === currentLocale) return;
    void i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    writeLocaleCookie(locale);
    markLocaleCookiePresent();
  }

  return (
    <div className={`relative inline-flex ${className}`} ref={containerRef}>
      <button
        aria-controls="language-options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("language.control")}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 py-1 pl-1.5 pr-3 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] outline-none backdrop-blur transition hover:border-teal-300 hover:bg-white hover:text-teal-900 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        title={t("language.control")}
        type="button"
      >
        <span className="grid size-7 place-items-center rounded-full bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
          <Languages aria-hidden="true" className="size-4" />
        </span>
        <span aria-hidden="true">
          {currentLocale === "pt-BR" ? "PT-BR" : "EN"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          aria-label={t("language.label")}
          className="absolute right-0 top-full z-[80] mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)] motion-safe:animate-[panel-enter_160ms_ease-out]"
          id="language-options"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            const options = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'),
            );
            const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            options[(currentIndex + direction + options.length) % options.length]?.focus();
          }}
          role="menu"
        >
          <button
            aria-checked={currentLocale === "pt-BR"}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${currentLocale === "pt-BR" ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-700 hover:bg-slate-50"}`}
            onClick={() => changeLanguage("pt-BR")}
            role="menuitemradio"
            type="button"
          >
            <span className="grid size-5 place-items-center">
              {currentLocale === "pt-BR" && <Check aria-hidden="true" className="size-4 text-teal-700" />}
            </span>
            <span className="flex-1">{t("language.portuguese")}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PT-BR</span>
          </button>
          <button
            aria-checked={currentLocale === "en"}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${currentLocale === "en" ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-700 hover:bg-slate-50"}`}
            onClick={() => changeLanguage("en")}
            role="menuitemradio"
            type="button"
          >
            <span className="grid size-5 place-items-center">
              {currentLocale === "en" && <Check aria-hidden="true" className="size-4 text-teal-700" />}
            </span>
            <span className="flex-1">{t("language.english")}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">EN</span>
          </button>
        </div>
      )}
    </div>
  );
}
