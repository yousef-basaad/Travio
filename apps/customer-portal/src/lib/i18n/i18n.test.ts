import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { dirOf, parseLocale } from "./locales";
import { translate } from "./translate";
import { en } from "./messages/en";
import { ar } from "./messages/ar";
import { createFormatters } from "./format";

describe("locales", () => {
  it("accepts only supported locales, defaulting to Arabic", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("ar")).toBe("ar");
    expect(parseLocale("fr")).toBe("ar");
    expect(parseLocale(undefined)).toBe("ar");
    expect(parseLocale("en; drop table")).toBe("ar");
  });

  it("Arabic is right-to-left, English left-to-right", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
});

describe("translate", () => {
  it("returns the message in the requested language", () => {
    expect(translate("ar", "nav.bookings")).toBe("حجوزاتي");
    expect(translate("en", "nav.bookings")).toBe("My Bookings");
  });

  it("fills placeholders and leaves unknown ones visible", () => {
    expect(translate("ar", "payments.paidOn", { date: "3 نوفمبر 2026" })).toBe("دُفعت في 3 نوفمبر 2026");
    expect(translate("en", "payments.paidOn")).toBe("Paid {date}");
  });
});

describe("Arabic messages", () => {
  it("cover exactly the English keys, with no empty text", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const value of Object.values(ar)) expect(value.trim()).not.toBe("");
  });

  it("keep the same placeholders as English", () => {
    const names = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(names(ar[key]), key).toEqual(names(en[key]));
    }
  });

  it("have a label for every status, method and type the portal shows", () => {
    const groups: Record<string, string[]> = {
      bookingStatus: ["draft", "pending", "confirmed", "completed", "cancelled"],
      invoiceStatus: ["draft", "issued", "paid", "partially_paid", "cancelled"],
      visaStatus: ["draft", "submitted", "approved", "rejected"],
      paymentMethod: ["cash", "card", "bank_transfer", "online"],
      cabin: ["economy", "business", "first"],
      board: ["room_only", "bed_breakfast", "half_board", "full_board", "all_inclusive"],
      transferType: ["airport_transfer", "hotel_transfer", "private_transfer", "shared_transfer"],
    };
    for (const [group, values] of Object.entries(groups)) {
      for (const value of values) expect(Object.keys(en), `${group}.${value}`).toContain(`${group}.${value}`);
    }
  });
});

describe("formatters", () => {
  it("write Arabic dates in the Gregorian calendar with Latin digits", () => {
    const date = createFormatters("ar").date("2026-11-03");
    expect(date).toMatch(/2026/);
    expect(date).toContain("نوفمبر");
    expect(date).not.toMatch(/[٠-٩]/);
  });
});

// Every screen gets its text from the message files. A JSX text node
// made of English words means a string was missed.
describe("components", () => {
  const SRC = join(__dirname, "..", "..");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return files(path);
      return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
    });

  // The brand name is the same in both languages.
  const ALLOWED = new Set(["Travio"]);

  it("contain no hard-coded English text", () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      // global-error.tsx renders without the app (and so without the
      // message files) and is deliberately bilingual.
      if (file.endsWith("global-error.tsx")) continue;
      const source = readFileSync(file, "utf8").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      for (const match of source.matchAll(/>\s*([A-Za-z][A-Za-z'’ ,.!?]*[A-Za-z.!?])\s*</g)) {
        if (ALLOWED.has(match[1]!)) continue;
        offenders.push(`${file.slice(SRC.length + 1)}: ${match[1]}`);
      }
      for (const match of source.matchAll(/\b(?:title|description|label|aria-label|placeholder|message|loadingLabel|errorMessage|emptyMessage|caption)="([^"]*[A-Za-z][^"]*)"/g)) {
        offenders.push(`${file.slice(SRC.length + 1)}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
