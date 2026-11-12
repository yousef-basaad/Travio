import { formatCurrency, formatDate, formatDateTime } from "@travio/utils";
import type { Locale } from "./locales";

// Arabic dates/numbers: Gregorian calendar with Latin digits ("3 نوفمبر
// 2026", "1,234.50 ر.س."), same as the dashboard. Plain "ar-SA" would
// default to Arabic-Indic digits, so both are pinned explicitly.
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US";
}

export interface Formatters {
  date: (iso: string) => string;
  dateTime: (iso: string) => string;
  currency: (amount: number, currency?: string) => string;
}

// The shared @travio/utils formatters, bound to one language.
export function createFormatters(locale: Locale): Formatters {
  const tag = intlLocale(locale);
  return {
    date: (iso) => formatDate(iso, tag),
    dateTime: (iso) => formatDateTime(iso, tag),
    currency: (amount, currency) => formatCurrency(amount, currency, tag),
  };
}
