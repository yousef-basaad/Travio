import { describe, it, expect } from "vitest";
import { approvalRate } from "./visa-stats";

describe("approvalRate", () => {
  it("is approved / decided as a whole percent", () => {
    expect(approvalRate({ draft: 5, submitted: 9, approved: 112, rejected: 31 })).toBe(78);
    expect(approvalRate({ draft: 0, submitted: 0, approved: 3, rejected: 0 })).toBe(100);
  });

  it("is null before anything is decided", () => {
    expect(approvalRate({ draft: 2, submitted: 4, approved: 0, rejected: 0 })).toBeNull();
  });
});
