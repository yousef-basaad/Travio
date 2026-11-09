import { describe, it, expect } from "vitest";
import { isAgencyInactive } from "./agency-active";

function client(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  } as unknown as Parameters<typeof isAgencyInactive>[0];
}

describe("isAgencyInactive", () => {
  it("is false while the agency is visible", async () => {
    await expect(isAgencyInactive(client({ data: { id: "t1" }, error: null }), "t1")).resolves.toBe(false);
  });

  it("is true when RLS hides the agency", async () => {
    await expect(isAgencyInactive(client({ data: null, error: null }), "t1")).resolves.toBe(true);
  });

  it("does not lock anyone out on a failed lookup", async () => {
    await expect(isAgencyInactive(client({ data: null, error: { message: "boom" } }), "t1")).resolves.toBe(false);
  });
});
