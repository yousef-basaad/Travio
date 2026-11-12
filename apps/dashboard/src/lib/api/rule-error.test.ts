import { describe, it, expect } from "vitest";
import { RuleError, ruleMessage, throwIfRuleError } from "./rule-error";
import { handleApiError } from "./handle-api-error";

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status });

describe("rule errors", () => {
  it("turns a known 409 into a RuleError", async () => {
    await expect(throwIfRuleError(json({ error: "payment_exceeds_balance" }, 409))).rejects.toMatchObject({
      messageKey: "ruleError.payment_exceeds_balance",
    });
  });

  it("ignores unknown codes and other statuses", async () => {
    await expect(throwIfRuleError(json({ error: "conflict" }, 409))).resolves.toBeUndefined();
    await expect(throwIfRuleError(json({ error: "payment_exceeds_balance" }, 500))).resolves.toBeUndefined();
  });

  it("picks the rule's message or the fallback", () => {
    expect(ruleMessage(new RuleError("invoice_number_taken"), "common.saveError")).toBe("ruleError.invoice_number_taken");
    expect(ruleMessage(new Error("x"), "common.saveError")).toBe("common.saveError");
  });
});

describe("database errors in API answers", () => {
  const answer = async (error: unknown) => {
    const response = handleApiError(error);
    return [response.status, await response.json()];
  };

  it("a money rule is a 409 with its code", async () => {
    expect(await answer({ code: "PL002", message: "payment_exceeds_balance" })).toEqual([409, { error: "payment_exceeds_balance" }]);
  });

  it("a duplicate is a 409", async () => {
    expect(await answer({ code: "23505", message: "invoice_number_taken" })).toEqual([409, { error: "invoice_number_taken" }]);
    expect(await answer({ code: "23505", message: "duplicate key value violates unique constraint" })).toEqual([409, { error: "conflict" }]);
  });

  it("a refused value or a malformed id is a 400", async () => {
    expect(await answer({ code: "23514", message: "check" })).toEqual([400, { error: "invalid_input" }]);
    expect(await answer({ code: "22P02", message: "invalid input syntax for type uuid" })).toEqual([400, { error: "invalid_id" }]);
  });

  it("never leaks the database message for unknown errors", async () => {
    expect(await answer({ code: "XX000", message: "secret detail" })).toEqual([500, { error: "internal_error" }]);
  });
});
