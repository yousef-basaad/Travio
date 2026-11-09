import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDayLabel,
  formatRelativeTime,
} from "@travio/utils";
import type { Locale } from "./locales";
import { translate } from "./translate";

// Arabic dates/numbers: Gregorian calendar with Latin digits ("3 نوفمبر
// 2026", "1,234.50 ر.س."). Plain "ar-SA" would default to Arabic-Indic
// digits, so the calendar and numbering system are pinned explicitly.
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US";
}

export interface Formatters {
  date: (iso: string) => string;
  dateTime: (iso: string) => string;
  dayLabel: (iso: string) => string;
  relativeTime: (iso: string) => string;
  currency: (amount: number, currency?: string) => string;
  /** Whole number with grouping ("1,250"), for amounts shown with a separate currency label. */
  number: (value: number) => string;
}

// The shared @travio/utils formatters, bound to one language.
export function createFormatters(locale: Locale): Formatters {
  const tag = intlLocale(locale);
  return {
    date: (iso) => formatDate(iso, tag),
    dateTime: (iso) => formatDateTime(iso, tag),
    dayLabel: (iso) =>
      formatDayLabel(iso, tag, {
        today: translate(locale, "date.today"),
        yesterday: translate(locale, "date.yesterday"),
      }),
    relativeTime: (iso) => formatRelativeTime(iso, tag),
    currency: (amount, currency) => formatCurrency(amount, currency, tag),
    number: (value) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(value),
  };
}
