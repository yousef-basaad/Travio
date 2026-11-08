import { describe, it, expect } from "vitest";
import { monthTrend } from "./month-trend";

describe("monthTrend", () => {
  it("compares this month with last month", () => {
    expect(monthTrend(12, 10)).toEqual({ value: "20%", direction: "up" });
    expect(monthTrend(5, 10)).toEqual({ value: "50%", direction: "down" });
  });

  it("has no trend from an empty month or without change", () => {
    expect(monthTrend(4, 0)).toBeUndefined();
    expect(monthTrend(4, 4)).toBeUndefined();
  });
});
