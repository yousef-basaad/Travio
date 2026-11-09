import { describe, it, expect } from "vitest";
import { agenciesHref, parseAgencyParams } from "./agency-params";

describe("agency params", () => {
  it("reads valid parameters", () => {
    expect(parseAgencyParams({ q: " alpha ", status: "inactive", page: "3" })).toEqual({ search: "alpha", status: "inactive", page: 3 });
  });

  it("falls back to defaults on anything else", () => {
    expect(parseAgencyParams({ status: "drop", page: "-1" })).toEqual({ search: "", status: "all", page: 1 });
    expect(parseAgencyParams({ page: "1.5" }).page).toBe(1);
    expect(parseAgencyParams({ q: ["a", "b"] }).search).toBe("a");
    expect(parseAgencyParams({ q: "x".repeat(300) }).search).toHaveLength(100);
  });

  it("builds a URL without the defaults", () => {
    expect(agenciesHref({ search: "", status: "all", page: 1 })).toBe("/tenants");
    expect(agenciesHref({ search: "a b", status: "active", page: 2 })).toBe("/tenants?q=a+b&status=active&page=2");
  });
});
