import { describe, it, expect } from "vitest";
import { telHref, whatsappHref } from "./contact-links";

describe("contact links", () => {
  it("keeps only digits and a leading plus", () => {
    expect(telHref("+966 (50) 000-0000")).toBe("tel:+966500000000");
    expect(telHref("050 000 0000")).toBe("tel:0500000000");
  });

  it("builds a WhatsApp link from digits alone", () => {
    expect(whatsappHref("+966 50 000 0000")).toBe("https://wa.me/966500000000");
    expect(whatsappHref("966&text=phish")).toBe("https://wa.me/966");
  });
});
