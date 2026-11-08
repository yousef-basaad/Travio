import { describe, it, expect } from "vitest";
import { dirOf, parseLocale } from "./locales";
import { translate } from "./translate";
import { en } from "./messages/en";
import { ar } from "./messages/ar";

describe("admin i18n", () => {
  it("accepts only supported locales, defaulting to English", () => {
    expect(parseLocale("ar")).toBe("ar");
    expect(parseLocale("fr")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
    expect(dirOf("ar")).toBe("rtl");
  });

  it("translates and fills placeholders", () => {
    expect(translate("ar", "nav.agencies")).toBe("المكاتب");
    expect(translate("en", "overview.kpi.agenciesActive", { count: 2 })).toBe("2 active");
  });

  it("Arabic covers exactly the English keys, with no empty text", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const value of Object.values(ar)) expect(value.trim()).not.toBe("");
  });
});
