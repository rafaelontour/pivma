import type {
  AppLocale,
  LocalizedDateFormatOptions,
  LocalizedNumberFormatOptions,
} from "@/types/I18n";

export function formatDate(
  value: Date | string | number,
  { locale, ...options }: LocalizedDateFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number,
  { locale, ...options }: LocalizedNumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function compareLocalized(left: string, right: string, locale: AppLocale) {
  return left.localeCompare(right, locale, { sensitivity: "base" });
}

