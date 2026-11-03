import { describe, it, expect } from "vitest";
import { dirOf, parseLocale } from "./locales";
import { translate } from "./translate";
import { en } from "./messages/en";
import { ar } from "./messages/ar";

describe("locales", () => {
  it("accepts only supported locales, defaulting to English", () => {
    expect(parseLocale("ar")).toBe("ar");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("fr")).toBe("en");
    expect(parseLocale("")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
    expect(parseLocale("ar; drop table")).toBe("en");
  });

  it("Arabic is right-to-left, English left-to-right", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
});

describe("translate", () => {
  it("returns the message in the requested language", () => {
    expect(translate("en", "nav.bookings")).toBe("Bookings");
    expect(translate("ar", "nav.bookings")).toBe("الحجوزات");
  });

  it("fills placeholders and leaves unknown ones visible", () => {
    expect(translate("en", "footer.rights", { year: 2026 })).toBe("© 2026 Travio. All rights reserved.");
    expect(translate("ar", "notifications.withUnread", { count: 3 })).toBe("الإشعارات (3 غير مقروءة)");
    expect(translate("en", "footer.lastUpdated")).toBe("Last updated: {time}");
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
