import type {
  AppLocale,
  LocalizedCurrencyFormatOptions,
  LocalizedDateFormatOptions,
  LocalizedDurationFormatOptions,
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

export function formatCurrency(
  value: number,
  { locale, currency, ...options }: LocalizedCurrencyFormatOptions,
) {
  return formatNumber(value, { locale, style: "currency", currency, ...options });
}

export function formatDuration(
  milliseconds: number,
  { locale, maximumFractionDigits = 2 }: LocalizedDurationFormatOptions,
) {
  return milliseconds >= 1000
    ? `${formatNumber(milliseconds / 1000, { locale, maximumFractionDigits })} s`
    : `${formatNumber(milliseconds, { locale })} ms`;
}

export function compareLocalized(left: string, right: string, locale: AppLocale) {
  return left.localeCompare(right, locale, { sensitivity: "base" });
}
