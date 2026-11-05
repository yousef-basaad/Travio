import { describe, it, expect } from "vitest";
import { dirOf, localeFromAcceptLanguage, parseLocale } from "./locales";
import { isMessageKey, translate } from "./translate";
import { en } from "./messages/en";
import { ar } from "./messages/ar";
import { FEATURES } from "../features-content";
import { SIGNUP_MESSAGES, signupSchema } from "@/features/signup/schemas/signup.schema";

describe("locales", () => {
  it("accepts only supported locales, defaulting to English", () => {
    expect(parseLocale("ar")).toBe("ar");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("fr")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
    expect(parseLocale("ar; drop table")).toBe("en");
  });

  it("Arabic is right-to-left, English left-to-right", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });

  it("picks the first of Arabic/English the browser prefers", () => {
    expect(localeFromAcceptLanguage("ar-SA,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,ar;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,ar;q=0.5")).toBe("ar");
    expect(localeFromAcceptLanguage("fr-FR,de")).toBe("en");
    expect(localeFromAcceptLanguage("")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });
});

describe("translate", () => {
  it("returns the message in the requested language and fills placeholders", () => {
    expect(translate("en", "nav.pricing")).toBe("Pricing");
    expect(translate("ar", "nav.pricing")).toBe("الأسعار");
    expect(translate("ar", "footer.rights", { year: 2026 })).toBe("© 2026 ترافيو. جميع الحقوق محفوظة.");
    expect(translate("en", "signup.sentTo")).toBe("We sent a confirmation link to {email}.");
  });
});

describe("Arabic messages", () => {
  it("cover exactly the English keys, with no empty text", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(ar)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("keep every placeholder of the English message", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
    }
  });
});

describe("keys used outside components", () => {
  it("feature content and signup messages all name real messages", () => {
    for (const feature of FEATURES) {
      for (const key of [feature.title, feature.summary, feature.description, ...feature.benefits]) {
        expect(isMessageKey(key), key).toBe(true);
      }
    }
    for (const key of Object.values(SIGNUP_MESSAGES)) {
      expect(isMessageKey(key), key).toBe(true);
    }
  });

  it("signup validation errors are message keys", () => {
    const result = signupSchema.safeParse({ fullName: "", agencyName: "", crNumber: "", email: "x", password: "1" });
    expect(result.success).toBe(false);
    for (const issue of result.success ? [] : result.error.issues) {
      expect(isMessageKey(issue.message), issue.message).toBe(true);
    }
  });
});
