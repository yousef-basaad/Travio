import type { MessageKey } from "@/lib/i18n/messages/en";

const MESSAGE_KEYS: Record<string, MessageKey> = {
  payment_exceeds_balance: "ruleError.payment_exceeds_balance",
  invoice_total_below_paid: "ruleError.invoice_total_below_paid",
  invoice_number_taken: "ruleError.invoice_number_taken",
};

// The request broke a business rule (a 409 with a known code). Carries a
// message key, so the form can explain it in the user's language.
export class RuleError extends Error {
  readonly messageKey: MessageKey;

  constructor(code: string) {
    super(code);
    this.messageKey = MESSAGE_KEYS[code]!;
  }
}

// Call before the generic !response.ok handling. Reads a clone, so the
// caller can still read the body.
export async function throwIfRuleError(response: Response): Promise<void> {
  if (response.status !== 409) return;
  const body: unknown = await response.clone().json().catch(() => null);
  const code = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "";
  if (code in MESSAGE_KEYS) throw new RuleError(code);
}

/** The rule's message key when `error` is a RuleError, else the fallback. */
export function ruleMessage(error: unknown, fallback: MessageKey): MessageKey {
  return error instanceof RuleError ? error.messageKey : fallback;
}
