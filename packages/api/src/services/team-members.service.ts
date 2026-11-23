import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import { toTeamMember, type TeamMember } from "./team-members.mapper";

/** A staff member as other staff see them: who, not how to reach them. */
export interface TeamDirectoryEntry {
  id: string;
  fullName: string | null;
}

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Reading the roster relies on the new
// profiles_select_tenant RLS policy (Product-4 migration) - without it
// this would return only the caller's own row, same limitation that
// made "view team members" impossible before this phase. Role changes
// go through the update_team_member_role() RPC (also added by that
// migration) rather than a direct .update() - profiles has no general
// UPDATE grant for authenticated users, and the RPC's own server-side
// checks (caller is agency_owner, target is same-tenant, new_role is one
// of the four assignable roles) are the actual authorization boundary,
// not just app-layer trust.
export const teamMembersService = {
  async listByTenant(supabase: SupabaseClient<Database>, tenantId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      // Customer-portal accounts share the tenant but aren't staff.
      .neq("role", "customer")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toTeamMember);
  },

  // Names for showing who a record is assigned to. Every staff role can
  // read it (unlike listByTenant, which the Team page uses and which
  // carries emails and roles), so it returns only id and name, and
  // leaves out customer-portal accounts that share the tenant.
  async listDirectory(supabase: SupabaseClient<Database>, tenantId: string): Promise<TeamDirectoryEntry[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("tenant_id", tenantId)
      .neq("role", "customer")
      .order("full_name", { ascending: true });

    if (error) throw error;
    return data.map((row) => ({ id: row.id, fullName: row.full_name }));
  },

  async updateRole(
    supabase: SupabaseClient<Database>,
    targetUserId: string,
    newRole: UserRole,
  ): Promise<TeamMember> {
    // update_team_member_role's SetofOptions (isOneToOne: true,
    // isSetofReturn: false) - like create_agency's - means the generated
    // client type already resolves `data` to the single scalar row, not
    // an array, so no .single()/.maybeSingle() is chained here, matching
    // how packages/auth's signUpAgency() calls create_agency.
    const { data, error } = await supabase.rpc("update_team_member_role", {
      target_user_id: targetUserId,
      new_role: newRole,
    });

    if (error) throw error;
    return toTeamMember(data);
  },
};
