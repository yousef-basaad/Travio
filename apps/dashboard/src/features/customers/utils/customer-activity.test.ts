import { describe, it, expect } from "vitest";
import { isActiveCustomer, whatsappNumber } from "./customer-activity";

describe("isActiveCustomer", () => {
  const now = new Date("2026-11-05T12:00:00Z");

  it("is active with activity within the last year", () => {
    expect(isActiveCustomer("2026-11-01T00:00:00Z", now)).toBe(true);
    expect(isActiveCustomer("2025-11-06T00:00:00Z", now)).toBe(true);
  });

  it("is inactive after a year, or with no activity at all", () => {
    expect(isActiveCustomer("2025-10-01T00:00:00Z", now)).toBe(false);
    expect(isActiveCustomer(null, now)).toBe(false);
    expect(isActiveCustomer("not a date", now)).toBe(false);
  });
});

describe("whatsappNumber", () => {
  it("keeps digits only and drops a 00 prefix", () => {
    expect(whatsappNumber("+966 50 123 4567")).toBe("966501234567");
    expect(whatsappNumber("00966501234567")).toBe("966501234567");
  });

  it("is null without a usable number", () => {
    expect(whatsappNumber(null)).toBeNull();
    expect(whatsappNumber("12-34")).toBeNull();
  });
});
