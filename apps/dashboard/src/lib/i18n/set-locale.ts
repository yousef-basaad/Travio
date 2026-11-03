"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale } from "./locales";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Saves the language choice. Anything other than a supported locale is
// stored as the default, so the cookie can never hold arbitrary input.
// The caller refreshes the page (router.refresh()) so the server renders
// the new lang/dir.
export async function setLocale(value: string): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, parseLocale(value), {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
