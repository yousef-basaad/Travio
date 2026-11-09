import type { Locale } from "./locales";
import { en, type MessageKey, type Messages } from "./messages/en";
import { ar } from "./messages/ar";

const MESSAGES: Record<Locale, Messages> = { en, ar };

export type TranslateVars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: TranslateVars) => string;

// The message for `key` in `locale`, with {name} placeholders filled from
// `vars`. A placeholder with no value is left as written, so a mistake
// shows up on screen instead of silently disappearing.
export function translate(locale: Locale, key: MessageKey, vars?: TranslateVars): string {
  const message = MESSAGES[locale][key] ?? en[key];
  if (!vars) return message;
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in vars ? String(vars[name]) : placeholder,
  );
}

// For text that may be a message key (e.g. a zod error message written
// as a key in a form schema): true when it names a known message.
export function isMessageKey(value: string): value is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, value);
}
