import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, refused, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireDashboardAccess: vi.fn(),
  team: { listDirectory: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireDashboardAccess: mocks.requireDashboardAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  teamMembersService: mocks.team,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.team.listDirectory.mockResolvedValue([{ id: "u1", fullName: "Sara" }]);
});

describe("GET /api/team/directory", () => {
  it("is open to staff roles other than the owner", async () => {
    mocks.requireDashboardAccess.mockResolvedValue(allowed("sales_agent"));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "u1", fullName: "Sara" }]);
    expect(mocks.team.listDirectory).toHaveBeenCalledWith({}, TENANT_ID);
  });

  it("passes an auth refusal through", async () => {
    mocks.requireDashboardAccess.mockResolvedValue(refused(401));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.team.listDirectory).not.toHaveBeenCalled();
  });

  it("hides a database error behind a 500", async () => {
    mocks.requireDashboardAccess.mockResolvedValue(allowed());
    mocks.team.listDirectory.mockRejectedValue(dbError("XX000"));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
