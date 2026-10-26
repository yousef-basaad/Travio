import { describe, it, expect } from "vitest";
import { ilikeAny, sanitizeSearch, toRange } from "./pagination";

describe("toRange", () => {
  it("maps 1-based pages to inclusive offsets", () => {
    expect(toRange({ page: 1, pageSize: 25 })).toEqual([0, 24]);
    expect(toRange({ page: 3, pageSize: 25 })).toEqual([50, 74]);
  });
});

describe("sanitizeSearch", () => {
  it("returns undefined for empty or whitespace-only input", () => {
    expect(sanitizeSearch(undefined)).toBeUndefined();
    expect(sanitizeSearch(null)).toBeUndefined();
    expect(sanitizeSearch("   ")).toBeUndefined();
  });

  it("removes only what could end the quoted value or act as a wildcard", () => {
    expect(sanitizeSearch('ali"),id.not.is.null')).toBe("ali ),id.not.is.null");
    expect(sanitizeSearch("50% off*")).toBe("50 off");
    expect(sanitizeSearch("a\\b")).toBe("a b");
  });

  it("keeps , ( ) so names like 'Sara (VIP), Ali' still match", () => {
    expect(sanitizeSearch("Sara (VIP), Ali")).toBe("Sara (VIP), Ali");
  });

  it("trims, collapses whitespace, and caps the length", () => {
    expect(sanitizeSearch("  sara   ali  ")).toBe("sara ali");
    expect(sanitizeSearch("x".repeat(500))).toHaveLength(100);
  });

  it("keeps Arabic text and @ / . for emails", () => {
    expect(sanitizeSearch("سارة")).toBe("سارة");
    expect(sanitizeSearch("sara@mail.com")).toBe("sara@mail.com");
  });
});

describe("ilikeAny", () => {
  it("builds one ilike condition per column", () => {
    expect(ilikeAny(["full_name", "email"], "sara")).toBe('full_name.ilike."*sara*",email.ilike."*sara*"');
  });
});
