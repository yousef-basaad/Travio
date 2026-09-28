import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import { toTeamMember, type TeamMember } from "./team-members.mapper";

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
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toTeamMember);
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
