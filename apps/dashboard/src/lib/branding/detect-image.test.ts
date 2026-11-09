import { describe, it, expect } from "vitest";
import { detectImage } from "./detect-image";

const text = (value: string) => new TextEncoder().encode(value);

describe("detectImage", () => {
  it("recognizes real images by their bytes", () => {
    expect(detectImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.extension).toBe("png");
    expect(detectImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.extension).toBe("jpg");
    expect(detectImage(text("RIFF0000WEBPVP8 "))?.extension).toBe("webp");
  });

  it("refuses everything else", () => {
    expect(detectImage(text("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"))).toBeNull();
    expect(detectImage(text("<html></html>"))).toBeNull();
    expect(detectImage(text("RIFF0000WAVEfmt "))).toBeNull();
    expect(detectImage(new Uint8Array())).toBeNull();
  });
});
