import { describe, it, expect } from "vitest";
import { billingHref, parseBillingParams } from "./billing-params";

describe("billing params", () => {
  it("reads valid parameters", () => {
    expect(parseBillingParams({ q: " alpha ", status: "past_due", page: "2" })).toEqual({ search: "alpha", status: "past_due", page: 2 });
    expect(parseBillingParams({ status: "none" }).status).toBe("none");
  });

  it("falls back to defaults on anything else", () => {
    expect(parseBillingParams({ status: "free", page: "x" })).toEqual({ search: "", status: "all", page: 1 });
  });

  it("builds a URL without the defaults", () => {
    expect(billingHref({ search: "", status: "all", page: 1 })).toBe("/billing");
    expect(billingHref({ search: "a", status: "trialing", page: 3 })).toBe("/billing?q=a&status=trialing&page=3");
  });
});
