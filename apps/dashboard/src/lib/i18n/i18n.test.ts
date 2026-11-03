import { describe, it, expect } from "vitest";
import { dirOf, parseLocale } from "./locales";
import { translate } from "./translate";
import { en } from "./messages/en";
import { ar } from "./messages/ar";
import { createFormatters, intlLocale } from "./format";

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

describe("createFormatters", () => {
  const iso = "2026-11-03T12:00:00Z";

  it("Arabic: Gregorian calendar, Arabic month names, Latin digits", () => {
    const format = createFormatters("ar");
    expect(intlLocale("ar")).toBe("ar-SA-u-ca-gregory-nu-latn");
    expect(format.date(iso)).toContain("نوفمبر");
    expect(format.date(iso)).toContain("2026");
    expect(format.date(iso)).not.toMatch(/[٠-٩]/);
    expect(format.currency(1234.5)).toContain("1,234.50");
    expect(format.currency(1234.5)).not.toMatch(/[٠-٩]/);
  });

  it("English stays en-US", () => {
    const format = createFormatters("en");
    expect(format.date(iso)).toBe("Nov 3, 2026");
    // Intl puts a non-breaking space between the code and the amount.
    expect(format.currency(1234.5)).toBe("SAR 1,234.50");
  });

  it("today/yesterday labels follow the language", () => {
    const now = new Date().toISOString();
    expect(createFormatters("en").dayLabel(now)).toBe("Today");
    expect(createFormatters("ar").dayLabel(now)).toBe("اليوم");
  });
});
