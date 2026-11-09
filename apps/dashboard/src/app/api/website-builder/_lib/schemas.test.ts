import { describe, it, expect } from "vitest";
import { saveSiteSchema } from "./schemas";

const valid = {
  isPublished: true,
  language: "ar",
  headline: "See the world",
  subheadline: "",
  about: null,
  city: " Jeddah ",
  phone: "+966 50 000 0000",
  whatsapp: "",
  email: "hi@agency.test",
  services: ["flights"],
  showServices: true,
  showAbout: true,
  showContact: false,
};

describe("saveSiteSchema", () => {
  it("accepts a valid site and normalizes blanks to null", () => {
    const parsed = saveSiteSchema.parse(valid);
    expect(parsed.subheadline).toBeNull();
    expect(parsed.whatsapp).toBeNull();
    expect(parsed.city).toBe("Jeddah");
  });

  it("needs a headline to publish, but not for a draft", () => {
    expect(saveSiteSchema.safeParse({ ...valid, headline: "  " }).success).toBe(false);
    expect(saveSiteSchema.safeParse({ ...valid, headline: "  ", isPublished: false }).success).toBe(true);
  });

  it("refuses bad values", () => {
    expect(saveSiteSchema.safeParse({ ...valid, whatsapp: "123456&text=phish" }).success).toBe(false);
    expect(saveSiteSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(saveSiteSchema.safeParse({ ...valid, services: ["casino"] }).success).toBe(false);
    expect(saveSiteSchema.safeParse({ ...valid, language: "fr" }).success).toBe(false);
    expect(saveSiteSchema.safeParse({ ...valid, headline: "x".repeat(121) }).success).toBe(false);
  });
});
