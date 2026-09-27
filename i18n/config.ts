import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";
import type { AppLocale } from "@/types/I18n";

export const DEFAULT_LOCALE: AppLocale = "pt-BR";
export const LOCALE_COOKIE_NAME = "pivma_locale";
export const SUPPORTED_LOCALES: readonly AppLocale[] = ["pt-BR", "en"];

export const resources = {
  "pt-BR": { translation: ptBR },
  en: { translation: en },
} as const;

export function normalizeLocale(value: unknown): AppLocale | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "pt-br" || normalized === "pt_br" || normalized === "pt") {
    return "pt-BR";
  }

  if (normalized === "en" || normalized.startsWith("en-") || normalized.startsWith("en_")) {
    return "en";
  }

  return null;
}

export function getMetadata(locale: AppLocale) {
  return resources[locale].translation.metadata;
}

