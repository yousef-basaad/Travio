import { describe, it, expect } from "vitest";
import { COUNTRY_CODES, countryName, countryOptions, isCountryCode } from "./countries";

describe("countries", () => {
  it("has unique two-letter codes", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    expect(COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true);
    expect(COUNTRY_CODES.length).toBe(249);
  });

  it("names a country in the UI language", () => {
    expect(countryName("SA", "en-US")).toBe("Saudi Arabia");
    expect(countryName("SA", "ar-SA-u-ca-gregory-nu-latn")).toBe("المملكة العربية السعودية");
  });

  it("validates codes and sorts options by name", () => {
    expect(isCountryCode("TR")).toBe(true);
    expect(isCountryCode("XX")).toBe(false);
    const names = countryOptions("en-US").map((option) => option.name);
    expect(names.indexOf("Egypt")).toBeLessThan(names.indexOf("Germany"));
  });
});
