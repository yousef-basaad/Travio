import { describe, it, expect } from "vitest";
import { formatFileSize } from "./format-file-size";

describe("formatFileSize", () => {
  it("uses B, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
