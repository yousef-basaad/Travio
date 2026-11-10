import type { MessageKey } from "@/lib/i18n/messages/en";

const MESSAGE_KEYS: Record<string, MessageKey> = {
  max_users: "planLimit.max_users",
  max_bookings_monthly: "planLimit.max_bookings_monthly",
  max_documents: "planLimit.max_documents",
  max_storage_mb: "planLimit.max_storage_mb",
};

// The agency's plan doesn't allow this. Carries a message key, so each
// form can show the reason in the user's language.
export class PlanLimitError extends Error {
  readonly messageKey: MessageKey;

  constructor(limit: string) {
    super(`plan_limit_reached:${limit}`);
    this.messageKey = MESSAGE_KEYS[limit] ?? "planLimit.generic";
  }
}

// Call before the generic !response.ok handling. Reads a clone, so the
// caller can still read the body.
export async function throwIfPlanLimit(response: Response): Promise<void> {
  if (response.status !== 403) return;
  const body: unknown = await response.clone().json().catch(() => null);
  if (body && typeof body === "object" && "error" in body && body.error === "plan_limit_reached") {
    throw new PlanLimitError("limit" in body && typeof body.limit === "string" ? body.limit : "");
  }
}
