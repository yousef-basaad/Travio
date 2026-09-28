import { describe, it, expect } from "vitest";
import { getDashboardGateRedirect } from "./dashboard-gate";

describe("getDashboardGateRedirect", () => {
  it("renders the dashboard for an authorized user", () => {
    expect(
      getDashboardGateRedirect({
        authorized: true,
        profile: {
          id: "user-1",
          tenantId: "tenant-1",
          customerId: null,
          email: "owner@example.com",
          fullName: "Owner",
          role: "agency_owner",
        },
      }),
    ).toBeNull();
  });

  it("sends a user with no session to /login", () => {
    expect(getDashboardGateRedirect({ authorized: false, reason: "unauthenticated" })).toBe("/login");
  });

  it("sends a signed-in user with no profile row to the no-profile forbidden page", () => {
    expect(
      getDashboardGateRedirect({ authorized: false, reason: "forbidden", detail: "no_profile" }),
    ).toBe("/forbidden?reason=no_profile");
  });

  it("sends a user whose role isn't allowed to /forbidden", () => {
    expect(
      getDashboardGateRedirect({ authorized: false, reason: "forbidden", detail: "role_not_allowed" }),
    ).toBe("/forbidden");
  });

  it("sends a profile-lookup failure to /forbidden (unchanged)", () => {
    expect(getDashboardGateRedirect({ authorized: false, reason: "error" })).toBe("/forbidden");
  });
});
