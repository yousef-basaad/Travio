import { describe, it, expect } from "vitest";
import { canChangeStatus, statusOptions } from "./status-transitions";

describe("booking status transitions", () => {
  it("offers the current status and the allowed moves, in order", () => {
    expect(statusOptions("draft")).toEqual(["draft", "pending", "confirmed", "cancelled"]);
    expect(statusOptions("confirmed")).toEqual(["pending", "confirmed", "completed", "cancelled"]);
    expect(statusOptions("completed")).toEqual(["confirmed", "completed"]);
    expect(statusOptions("cancelled")).toEqual(["draft", "cancelled"]);
  });

  it("matches the database rules", () => {
    expect(canChangeStatus("cancelled", "completed")).toBe(false);
    expect(canChangeStatus("completed", "cancelled")).toBe(false);
    expect(canChangeStatus("draft", "completed")).toBe(false);
    expect(canChangeStatus("confirmed", "completed")).toBe(true);
    expect(canChangeStatus("pending", "pending")).toBe(true);
  });
});
