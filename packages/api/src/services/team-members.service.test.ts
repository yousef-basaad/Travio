import { describe, it, expect } from "vitest";
import { teamMembersService } from "./team-members.service";
import { createFakeSupabaseClient, findCallsByMethod, findCalls } from "../test-utils/fake-supabase";

const PROFILE_ROW = {
  id: "user-1",
  tenant_id: "tenant-1",
  email: "agent@example.com",
  full_name: "Test Agent",
  role: "sales_agent",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

describe("teamMembersService", () => {
  describe("listByTenant", () => {
    it("filters by tenant_id and maps to the TeamMember domain shape", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        profiles: [{ data: [PROFILE_ROW], error: null }],
      });

      const members = await teamMembersService.listByTenant(client, "tenant-1");

      const eqCalls = findCallsByMethod(allCalls, "profiles", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["tenant_id", "tenant-1"] });

      expect(members).toEqual([
        {
          id: "user-1",
          tenantId: "tenant-1",
          email: "agent@example.com",
          fullName: "Test Agent",
          role: "sales_agent",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ]);
    });
  });

  describe("updateRole", () => {
    it("calls update_team_member_role via rpc() with the target id and new role", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        "rpc:update_team_member_role": [
          { data: { ...PROFILE_ROW, role: "branch_manager" }, error: null },
        ],
      });

      const member = await teamMembersService.updateRole(client, "user-1", "branch_manager");

      const [rpcCall] = findCalls(allCalls, "rpc:update_team_member_role");
      expect(rpcCall?.calls[0]).toEqual({
        method: "rpc",
        args: ["update_team_member_role", { target_user_id: "user-1", new_role: "branch_manager" }],
      });
      expect(member.role).toBe("branch_manager");
    });
  });
});
