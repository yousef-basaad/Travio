import { describe, it, expect } from "vitest";
import { normalizeMfaCode } from "./mfa-code";

describe("normalizeMfaCode", () => {
  it("accepts six digits, with a space or in Arabic", () => {
    expect(normalizeMfaCode("123456")).toBe("123456");
    expect(normalizeMfaCode("123 456")).toBe("123456");
    expect(normalizeMfaCode("١٢٣٤٥٦")).toBe("123456");
  });

  it("refuses anything else", () => {
    for (const bad of ["", "12345", "1234567", "abcdef"]) expect(normalizeMfaCode(bad)).toBeNull();
  });
});
