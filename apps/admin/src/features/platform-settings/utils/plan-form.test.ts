import { describe, it, expect } from "vitest";
import { parsePlanForm } from "./plan-form";

const limits = { max_users: "5", max_bookings_monthly: "100", max_documents: "unlimited", max_storage_mb: "1024" };

describe("parsePlanForm", () => {
  it("accepts valid values", () => {
    expect(parsePlanForm("99.50", limits)).toEqual({ price: 99.5, limits });
    expect(parsePlanForm("0", limits)?.price).toBe(0);
  });

  it("reads Arabic digits", () => {
    expect(parsePlanForm("١٢٠", { ...limits, max_users: "٢٥" })).toEqual({ price: 120, limits: { ...limits, max_users: "25" } });
  });

  it("refuses bad prices", () => {
    for (const price of ["", "-1", "1.234", "abc", "99999999"]) expect(parsePlanForm(price, limits)).toBeNull();
    expect(parsePlanForm(5, limits)).toBeNull();
  });

  it("refuses bad or missing limits", () => {
    expect(parsePlanForm("1", { ...limits, max_users: "0" })).toBeNull();
    expect(parsePlanForm("1", { ...limits, max_users: "1.5" })).toBeNull();
    expect(parsePlanForm("1", { max_users: "5" })).toBeNull();
    expect(parsePlanForm("1", null)).toBeNull();
  });

  it("only returns the known limits", () => {
    expect(parsePlanForm("1", { ...limits, max_cats: "9" })?.limits).toEqual(limits);
  });
});
