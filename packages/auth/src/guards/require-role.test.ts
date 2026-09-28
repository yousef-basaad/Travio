import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserRole } from "@travio/types";

// Stabilization Phase 1: covers the fix that used to be untested -
// requireRole() must not collapse "the profile query itself failed"
// into "forbidden". Mocks only the exact chain requireRole() calls
// (auth.getUser(), from("profiles").select().eq().single()) rather than
// pulling in packages/api's fuller fake-supabase test util, which this
// package has no other reason to depend on.

let currentUser: { id: string } | null = { id: "user-1" };
let profileResult: { data: unknown; error: { code: string; message: string } | null } = {
  data: null,
  error: null,
};

vi.mock("@travio/database/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: currentUser } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => profileResult),
        })),
      })),
    })),
  })),
}));

const loggerError = vi.fn();
vi.mock("@travio/logger", () => ({
  logger: { error: loggerError },
}));

import { requireRole } from "./require-role";

const ALLOWED: UserRole[] = ["agency_owner"];

beforeEach(() => {
  currentUser = { id: "user-1" };
  profileResult = { data: null, error: null };
  loggerError.mockClear();
});

describe("requireRole", () => {
  it("returns unauthenticated when there is no session", async () => {
    currentUser = null;
    const result = await requireRole(ALLOWED);
    expect(result).toEqual({ authorized: false, reason: "unauthenticated" });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("authorizes when the profile row exists with an allowed role", async () => {
    profileResult = {
      data: {
        id: "user-1",
        tenant_id: "tenant-1",
        customer_id: null,
        email: "owner@example.com",
        full_name: "Test Owner",
        role: "agency_owner",
      },
      error: null,
    };
    const result = await requireRole(ALLOWED);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.profile.role).toBe("agency_owner");
    }
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("returns forbidden when the profile row exists with a disallowed role", async () => {
    profileResult = {
      data: {
        id: "user-1",
        tenant_id: "tenant-1",
        customer_id: null,
        email: "agent@example.com",
        full_name: "Test Agent",
        role: "sales_agent",
      },
      error: null,
    };
    const result = await requireRole(ALLOWED);
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("returns forbidden (not error) when no profile row exists (PGRST116)", async () => {
    profileResult = {
      data: null,
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
    };
    const result = await requireRole(ALLOWED);
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("returns a distinct 'error' reason (never 'forbidden') on a real query failure, and logs it", async () => {
    profileResult = {
      data: null,
      error: { code: "57P01", message: "terminating connection due to administrator command" },
    };
    const result = await requireRole(ALLOWED);
    expect(result).toEqual({ authorized: false, reason: "error" });
    expect(loggerError).toHaveBeenCalledTimes(1);
    const [payload] = loggerError.mock.calls[0] as [Record<string, unknown>];
    expect(payload.action).toBe("requireRole");
    expect(payload.userId).toBe("user-1");
    expect(payload.error).toMatchObject({ code: "57P01" });
  });
});
