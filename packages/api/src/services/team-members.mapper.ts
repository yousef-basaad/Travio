import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// Deliberately its own shape, not @travio/types' Profile - that one
// backs the authenticated caller's own session (id/tenantId/email/
// fullName/role only, no createdAt) and is used by requireRole's return
// value; a team roster additionally needs createdAt ("member since") and
// will grow its own fields (e.g. invite status, merged in at the route
// layer from auth.admin.getUserById - see /api/team/route.ts) that have
// no place on the session-profile shape.
export interface TeamMember {
  id: string;
  tenantId: string | null;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export function toTeamMember(row: ProfileRow): TeamMember {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}
