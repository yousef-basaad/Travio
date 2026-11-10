import { describe, it, expect } from "vitest";
import { updateTenantSchema } from "./schemas";

describe("updateTenantSchema", () => {
  it("accepts contact details and clears a blank", () => {
    expect(updateTenantSchema.parse({ phone: "+966500000000" })).toEqual({ phone: "+966500000000" });
    expect(updateTenantSchema.parse({ address: "" })).toEqual({ address: null });
  });

  it("refuses a request with nothing it can change", () => {
    expect(updateTenantSchema.safeParse({}).success).toBe(false);
    expect(updateTenantSchema.safeParse({ slug: "hijack", isActive: false }).success).toBe(false);
  });
});
