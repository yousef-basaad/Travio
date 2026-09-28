import { z } from "zod";

// Matches the four roles update_team_member_role() (and the invite
// route below) actually allow assigning - travio_admin/agency_owner/
// customer are never assignable through this surface, same restriction
// the RPC re-enforces server-side.
export const assignableRoleSchema = z.enum([
  "sales_agent",
  "branch_manager",
  "visa_officer",
  "accountant",
]);

// tenantId/invitedBy are intentionally absent - both come from the
// authenticated session server-side (see team/route.ts's POST handler),
// never trusted from the request body.
export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1, "Name is required"),
  role: assignableRoleSchema,
});

export const updateTeamMemberRoleSchema = z.object({
  role: assignableRoleSchema,
});

// Shared response shape for GET/POST /api/team and PATCH /api/team/:id -
// lives here (not exported from route.ts) since Next.js route files may
// only export recognized handler functions/route config, never arbitrary
// types; features/team/api/team.api.ts mirrors this shape locally rather
// than importing it, for the same reason.
export interface TeamMemberResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: "active" | "pending";
  createdAt: string;
}
