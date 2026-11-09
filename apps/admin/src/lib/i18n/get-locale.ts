import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./locales";

// Server-side: the signed-in browser's chosen language (English when
// unset or unrecognised).
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
}
