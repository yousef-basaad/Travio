// The portal's languages. The choice lives in a cookie so the server
// can render <html lang dir> correctly on the first response (no flash
// of the wrong direction). Customers are mostly Arabic speakers, so
// Arabic is the default here (the dashboard defaults to English).

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "travio_locale";

export function parseLocale(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
