import { describe, it, expect } from "vitest";
import { parseUserParams, usersHref } from "./user-params";

describe("user params", () => {
  it("reads valid parameters", () => {
    expect(parseUserParams({ q: " sara ", role: "sales_agent", page: "2" })).toEqual({ search: "sara", role: "sales_agent", page: 2 });
  });

  it("falls back to defaults on anything else", () => {
    expect(parseUserParams({ role: "root", page: "0" })).toEqual({ search: "", role: "all", page: 1 });
    expect(parseUserParams({ q: "x".repeat(300) }).search).toHaveLength(100);
  });

  it("builds a URL without the defaults", () => {
    expect(usersHref({ search: "", role: "all", page: 1 })).toBe("/platform-users");
    expect(usersHref({ search: "a", role: "accountant", page: 3 })).toBe("/platform-users?q=a&role=accountant&page=3");
  });
});
