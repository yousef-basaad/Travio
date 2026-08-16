// Gregorian date formatting shared across apps. Hijri support can be added
// here later via a single dependency without touching feature code.
export function formatDate(iso: string, locale: "ar-SA" | "en-US" = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

// Extracted from flight-item.tsx/transfer-item.tsx, which each defined
// this exact function locally for timestamptz fields (departure/arrival
// time, pickup time) where the time-of-day component matters and
// formatDate's date-only output isn't enough.
export function formatDateTime(iso: string, locale: "ar-SA" | "en-US" = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Calendar-day bucket label ("Today"/"Yesterday"/"Jul 29, 2026") for
// grouping a list of timestamped items by day - distinct from
// formatRelativeTime, which produces a continuously-changing "N units
// ago" string per item and isn't stable enough to use as a grouping key
// (two events a few hours apart can cross a calendar-day boundary while
// still both reading as "N hours ago"). Used by BookingTimeline to group
// events by day; day boundaries are computed in the browser's local
// timezone, matching every other date display in this app.
export function formatDayLabel(iso: string, locale: "ar-SA" | "en-US" = "en-US"): string {
  const date = new Date(iso);
  const today = new Date();
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(iso, locale);
}
