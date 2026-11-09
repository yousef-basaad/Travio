import { describe, it, expect } from "vitest";
import { approvalRate, monthTrend } from "./visa-stats";

describe("approvalRate", () => {
  it("is approved / decided as a whole percent", () => {
    expect(approvalRate({ draft: 5, submitted: 9, approved: 112, rejected: 31 })).toBe(78);
    expect(approvalRate({ draft: 0, submitted: 0, approved: 3, rejected: 0 })).toBe(100);
  });

  it("is null before anything is decided", () => {
    expect(approvalRate({ draft: 2, submitted: 4, approved: 0, rejected: 0 })).toBeNull();
  });
});

describe("monthTrend", () => {
  it("compares this month with last month", () => {
    expect(monthTrend(12, 10)).toEqual({ value: "20%", direction: "up" });
    expect(monthTrend(5, 10)).toEqual({ value: "50%", direction: "down" });
  });

  it("has no trend without a previous month or without change", () => {
    expect(monthTrend(4, 0)).toBeUndefined();
    expect(monthTrend(4, 4)).toBeUndefined();
  });
});
