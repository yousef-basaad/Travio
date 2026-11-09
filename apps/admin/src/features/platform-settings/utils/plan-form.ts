export const PLAN_LIMIT_KEYS = ["max_users", "max_bookings_monthly", "max_documents", "max_storage_mb"] as const;

export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[number];

export interface PlanFormValues {
  price: number;
  limits: Record<PlanLimitKey, string>;
}

const ARABIC_ZERO = 0x0660;

// Arabic keyboards type ٠-٩; the database only takes 0-9.
function latinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_ZERO)).trim();
}

// Checks what the admin typed, with the same rules as
// platform_update_plan(), and returns it ready to save (null if invalid).
export function parsePlanForm(price: unknown, limits: unknown): PlanFormValues | null {
  if (typeof price !== "string" || typeof limits !== "object" || limits === null) return null;

  const priceText = latinDigits(price);
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(priceText)) return null;

  const parsed = {} as Record<PlanLimitKey, string>;
  for (const key of PLAN_LIMIT_KEYS) {
    const raw = (limits as Record<string, unknown>)[key];
    if (typeof raw !== "string") return null;
    const value = latinDigits(raw);
    if (!/^([1-9]\d{0,8}|unlimited)$/.test(value)) return null;
    parsed[key] = value;
  }

  return { price: Number(priceText), limits: parsed };
}
