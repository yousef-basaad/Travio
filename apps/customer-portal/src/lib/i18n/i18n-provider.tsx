"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, dirOf, type Locale } from "./locales";
import { translate, type Translate } from "./translate";
import { createFormatters, type Formatters } from "./format";

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Translate;
  format: Formatters;
}

const I18nContext = createContext<I18nValue | null>(null);

// The locale comes from the root layout (read from the cookie on the
// server), so client components translate with the same language the
// server rendered.
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useCallback<Translate>((key, vars) => translate(locale, key, vars), [locale]);
  const value = useMemo(() => ({ locale, dir: dirOf(locale), t, format: createFormatters(locale) }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Outside a provider (e.g. an isolated component test) this falls back
// to the default language (Arabic) rather than throwing.
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value) return value;
  return {
    locale: DEFAULT_LOCALE,
    dir: dirOf(DEFAULT_LOCALE),
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    format: createFormatters(DEFAULT_LOCALE),
  };
}

export function useT(): Translate {
  return useI18n().t;
}

// Dates, times and money in the user's language (see format.ts).
export function useFormat(): Formatters {
  return useI18n().format;
}
