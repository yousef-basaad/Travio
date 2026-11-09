import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, localeFromAcceptLanguage, parseLocale, type Locale } from "./locales";
import { translate, type Translate } from "./translate";

// Server-side: the visitor's chosen language (the cookie), or on a first
// visit the browser's preferred one.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const saved = store.get(LOCALE_COOKIE)?.value;
  if (saved) return parseLocale(saved);
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

// For server components and generateMetadata.
export async function getT(): Promise<Translate> {
  const locale = await getLocale();
  return (key, vars) => translate(locale, key, vars);
}
