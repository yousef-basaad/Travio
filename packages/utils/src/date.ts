// Gregorian date formatting shared across apps. Hijri support can be added
// here later via a single dependency without touching feature code.
export function formatDate(iso: string, locale: "ar-SA" | "en-US" = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
