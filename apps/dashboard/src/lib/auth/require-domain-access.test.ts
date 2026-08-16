import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserRole, Profile } from "@travio/types";

// Mocks the two things requireDomainAccess() composes: requireRole()
// (auth + profile lookup) and createServerSupabaseClient() (the
// tenant-scoped client). This mirrors real requireRole() behavior -
// authorized only if the given role is in the allowed list - so each
// domain helper's actual allowed-role list is what's under test, not a
// hand-faked per-test return value.
let currentRole: UserRole | null = "agency_owner";
let currentTenantId: string | null = "tenant-1";

vi.mock("@travio/auth/server", () => ({
  requireRole: vi.fn(async (allowedRoles: UserRole[]) => {
    if (!currentRole) {
      return { authorized: false as const, reason: "unauthenticated" as const };
    }
    if (!allowedRoles.includes(currentRole)) {
      return { authorized: false as const, reason: "forbidden" as const };
    }
    const profile: Profile = {
      id: "user-1",
      tenantId: currentTenantId,
      customerId: null,
      email: "user@example.com",
      fullName: "Test User",
      role: currentRole,
    };
    return { authorized: true as const, profile };
  }),
}));

vi.mock("@travio/database/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({}) as unknown),
}));

import {
  requireCustomersAccess,
  requireLeadsAccess,
  requireBookingsAccess,
  requireVisaAccess,
  requireFinanceAccess,
  requireDocumentsAccess,
  requireAnalyticsAccess,
  requireNotificationAccess,
  requireAgencyOwnerAccess,
} from "./require-domain-access";

beforeEach(() => {
  currentRole = "agency_owner";
  currentTenantId = "tenant-1";
});

async function expectAllowed(helper: () => Promise<{ ok: boolean }>) {
  const result = await helper();
  expect(result.ok).toBe(true);
}

async function expectForbidden(helper: () => Promise<{ ok: boolean; response?: Response }>) {
  const result = await helper();
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.response?.status).toBe(403);
  }
}

describe("require-domain-access", () => {
  describe("unauthenticated / no tenant (shared bootstrap, every helper)", () => {
    it("returns 401 when there is no session", async () => {
      currentRole = null;
      const result = await requireBookingsAccess();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(401);
    });

    it("returns 403 no_tenant_context when the profile has no tenant", async () => {
      currentRole = "sales_agent";
      currentTenantId = null;
      const result = await requireBookingsAccess();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(403);
        const body = (await result.response.json()) as { error: string };
        expect(body.error).toBe("no_tenant_context");
      }
    });

    it("exposes role/userId/tenantId/supabase on success", async () => {
      currentRole = "sales_agent";
      const result = await requireBookingsAccess();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.access.role).toBe("sales_agent");
        expect(result.access.tenantId).toBe("tenant-1");
        expect(result.access.userId).toBe("user-1");
        expect(result.access.supabase).toBeDefined();
      }
    });
  });

  describe("requireCustomersAccess / requireLeadsAccess / requireBookingsAccess (unchanged CRM roles)", () => {
    it.each([
      ["requireCustomersAccess", requireCustomersAccess],
      ["requireLeadsAccess", requireLeadsAccess],
      ["requireBookingsAccess", requireBookingsAccess],
    ] as const)("%s allows travio_admin/agency_owner/branch_manager/sales_agent", async (_name, helper) => {
      for (const role of ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const) {
        currentRole = role;
        await expectAllowed(helper);
      }
    });

    it.each([
      ["requireCustomersAccess", requireCustomersAccess],
      ["requireLeadsAccess", requireLeadsAccess],
      ["requireBookingsAccess", requireBookingsAccess],
    ] as const)("%s rejects visa_officer and accountant (wrong-role rejection)", async (_name, helper) => {
      for (const role of ["visa_officer", "accountant"] as const) {
        currentRole = role;
        await expectForbidden(helper);
      }
    });
  });

  describe("requireVisaAccess", () => {
    it("allows travio_admin, agency_owner, branch_manager, visa_officer", async () => {
      for (const role of ["travio_admin", "agency_owner", "branch_manager", "visa_officer"] as const) {
        currentRole = role;
        await expectAllowed(requireVisaAccess);
      }
    });

    it("rejects sales_agent (Phase 4D narrows Visa to its own domain)", async () => {
      currentRole = "sales_agent";
      await expectForbidden(requireVisaAccess);
    });

    it("rejects accountant", async () => {
      currentRole = "accountant";
      await expectForbidden(requireVisaAccess);
    });
  });

  describe("requireFinanceAccess", () => {
    it("allows travio_admin, agency_owner, accountant", async () => {
      for (const role of ["travio_admin", "agency_owner", "accountant"] as const) {
        currentRole = role;
        await expectAllowed(requireFinanceAccess);
      }
    });

    it("rejects sales_agent and branch_manager (Phase 4D makes Finance accountant-exclusive)", async () => {
      for (const role of ["sales_agent", "branch_manager"] as const) {
        currentRole = role;
        await expectForbidden(requireFinanceAccess);
      }
    });

    it("rejects visa_officer", async () => {
      currentRole = "visa_officer";
      await expectForbidden(requireFinanceAccess);
    });
  });

  describe("requireDocumentsAccess (broadest domain)", () => {
    it("allows every staff role", async () => {
      for (const role of [
        "travio_admin",
        "agency_owner",
        "branch_manager",
        "sales_agent",
        "visa_officer",
        "accountant",
      ] as const) {
        currentRole = role;
        await expectAllowed(requireDocumentsAccess);
      }
    });

    it("rejects customer", async () => {
      currentRole = "customer";
      await expectForbidden(requireDocumentsAccess);
    });
  });

  describe("requireAnalyticsAccess", () => {
    // sales_agent added (auth redirect fix follow-up): the dashboard
    // layout gate already let sales_agent reach /analytics, so excluding
    // it here meant the page rendered but every /api/analytics/* call
    // 401'd for that role - corrected so the two gates agree.
    it("allows travio_admin, agency_owner, branch_manager, sales_agent", async () => {
      for (const role of ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const) {
        currentRole = role;
        await expectAllowed(requireAnalyticsAccess);
      }
    });

    it("rejects visa_officer, accountant", async () => {
      for (const role of ["visa_officer", "accountant"] as const) {
        currentRole = role;
        await expectForbidden(requireAnalyticsAccess);
      }
    });
  });

  describe("requireNotificationAccess (personal inbox, every dashboard-eligible role)", () => {
    it("allows every staff role, including the newly dashboard-eligible visa_officer/accountant", async () => {
      for (const role of [
        "travio_admin",
        "agency_owner",
        "branch_manager",
        "sales_agent",
        "visa_officer",
        "accountant",
      ] as const) {
        currentRole = role;
        await expectAllowed(requireNotificationAccess);
      }
    });

    it("rejects customer", async () => {
      currentRole = "customer";
      await expectForbidden(requireNotificationAccess);
    });
  });

  describe("requireAgencyOwnerAccess (Product-4: team/tenant/subscription)", () => {
    it("allows travio_admin, agency_owner", async () => {
      for (const role of ["travio_admin", "agency_owner"] as const) {
        currentRole = role;
        await expectAllowed(requireAgencyOwnerAccess);
      }
    });

    it("rejects every staff role below owner", async () => {
      for (const role of [
        "branch_manager",
        "sales_agent",
        "visa_officer",
        "accountant",
      ] as const) {
        currentRole = role;
        await expectForbidden(requireAgencyOwnerAccess);
      }
    });

    it("rejects customer", async () => {
      currentRole = "customer";
      await expectForbidden(requireAgencyOwnerAccess);
    });
  });

  describe("agency_owner reaches every domain", () => {
    it("is allowed by every requireXAccess() helper", async () => {
      currentRole = "agency_owner";
      for (const helper of [
        requireCustomersAccess,
        requireLeadsAccess,
        requireBookingsAccess,
        requireVisaAccess,
        requireFinanceAccess,
        requireDocumentsAccess,
        requireAnalyticsAccess,
        requireNotificationAccess,
        requireAgencyOwnerAccess,
      ]) {
        await expectAllowed(helper);
      }
    });
  });
});
