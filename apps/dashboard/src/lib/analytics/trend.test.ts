import { describe, it, expect } from "vitest";
import { trendFrom } from "./trend";

describe("trendFrom", () => {
  it("compares the last value with the one before", () => {
    expect(trendFrom([1, 10, 12])).toEqual({ value: "20%", direction: "up" });
    expect(trendFrom([10, 5])).toEqual({ value: "50%", direction: "down" });
  });

  it("has no trend without a usable previous value or without change", () => {
    expect(trendFrom([])).toBeUndefined();
    expect(trendFrom([4])).toBeUndefined();
    expect(trendFrom([0, 4])).toBeUndefined();
    expect(trendFrom([-500, 300])).toBeUndefined();
    expect(trendFrom([4, 4])).toBeUndefined();
  });
});
