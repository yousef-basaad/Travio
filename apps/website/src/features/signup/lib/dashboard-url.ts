// The dashboard's base URL (e.g. "https://app.travio.com"), from
// NEXT_PUBLIC_DASHBOARD_URL. Returns null - never throws - when it's
// missing or not an http(s) URL, so signup can show a friendly message
// while logging the real configuration problem.
export function getDashboardUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
