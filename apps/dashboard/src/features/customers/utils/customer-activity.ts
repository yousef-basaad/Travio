// A customer is "active" when something happened with them in the last
// year: their record changed, a booking of theirs was created/updated,
// or they paid (lastActivityAt from customer_list_stats). Otherwise
// "inactive". Derived, not stored - change the window here.
export const ACTIVE_WINDOW_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isActiveCustomer(lastActivityAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastActivityAt) return false;
  const time = new Date(lastActivityAt).getTime();
  if (Number.isNaN(time)) return false;
  return now.getTime() - time <= ACTIVE_WINDOW_DAYS * DAY_MS;
}

// Digits only, for wa.me links ("+966 50 123 4567" -> "966501234567").
// Null when nothing dialable is left.
export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 8 ? digits : null;
}
