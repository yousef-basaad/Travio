import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Profile } from "@travio/types";

const loggerError = vi.hoisted(() => vi.fn());
vi.mock("@travio/logger", () => ({ logger: { error: loggerError } }));
vi.mock("@travio/database/server", () => ({ createServerSupabaseClient: vi.fn() }));

import { completeAgencySetup } from "./complete-agency-setup";
import { getAgencySetupRedirect } from "./dashboard-gate";

// Fake of the two calls completeAgencySetup() makes.
let userMetadata: Record<string, unknown> | undefined;
let rpcError: { message: string } | null;
const getUser = vi.fn(async () => ({
  data: { user: { id: "user-1", user_metadata: userMetadata } },
  error: null,
}));
const rpc = vi.fn(async () => ({ data: rpcError ? null : { id: "tenant-1" }, error: rpcError }));
const getClient = vi.fn(async () => ({ auth: { getUser }, rpc }) as never);

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    tenantId: null,
    customerId: null,
    email: "owner@agency.test",
    fullName: "Owner",
    role: "agency_owner",
    ...overrides,
  };
}

describe("completeAgencySetup", () => {
  beforeEach(() => {
    userMetadata = { agency_name: "Acme Travel", cr_number: "1010000001" };
    rpcError = null;
    getUser.mockClear();
    rpc.mockClear();
    getClient.mockClear();
    loggerError.mockClear();
  });

  it("creates the agency from user_metadata when the owner has no tenant", async () => {
    await expect(completeAgencySetup(profile(), getClient)).resolves.toBe("created");
    expect(rpc).toHaveBeenCalledWith("create_agency", {
      agency_name: "Acme Travel",
      agency_cr_number: "1010000001",
    });
  });

  it("is a no-op (no Supabase call at all) when the owner already has a tenant", async () => {
    await expect(completeAgencySetup(profile({ tenantId: "tenant-1" }), getClient)).resolves.toBe(
      "not_needed",
    );
    expect(getClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("is a no-op for every other role", async () => {
    for (const role of ["travio_admin", "branch_manager", "sales_agent", "visa_officer", "accountant"] as const) {
      await expect(completeAgencySetup(profile({ role }), getClient)).resolves.toBe("not_needed");
    }
    expect(getClient).not.toHaveBeenCalled();
  });

  it('treats "caller already belongs to an agency" as success', async () => {
    rpcError = { message: "create_agency: caller already belongs to an agency" };
    await expect(completeAgencySetup(profile(), getClient)).resolves.toBe("already_exists");
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("reports any other create_agency error as failed and logs it", async () => {
    rpcError = { message: "connection reset" };
    await expect(completeAgencySetup(profile(), getClient)).resolves.toBe("failed");
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it("reports missing agency metadata without calling create_agency", async () => {
    userMetadata = { full_name: "Owner", account_type: "agency" };
    await expect(completeAgencySetup(profile(), getClient)).resolves.toBe("missing_metadata");
    userMetadata = { agency_name: "   ", cr_number: "1010000001" };
    await expect(completeAgencySetup(profile(), getClient)).resolves.toBe("missing_metadata");
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("getAgencySetupRedirect", () => {
  it("renders normally when setup isn't needed", () => {
    expect(getAgencySetupRedirect("not_needed")).toBeNull();
  });

  it("created / already_exists continue to /", () => {
    expect(getAgencySetupRedirect("created")).toBe("/");
    expect(getAgencySetupRedirect("already_exists")).toBe("/");
  });

  it("missing metadata goes to the setup-incomplete page", () => {
    expect(getAgencySetupRedirect("missing_metadata")).toBe("/forbidden?reason=setup_incomplete");
  });

  it("any other failure goes to the setup-failed page, not back to / (no loop)", () => {
    expect(getAgencySetupRedirect("failed")).toBe("/forbidden?reason=setup_failed");
  });
});
