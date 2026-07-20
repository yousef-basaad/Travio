import { createServerSupabaseClient } from "@travio/database/server";
import type { UserRole, Profile } from "@travio/types";
import type { Database } from "@travio/database";


type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "tenant_id" | "email" | "full_name" | "role"
>;


export async function requireRole(allowedRoles: UserRole[]) {

  const supabase = await createServerSupabaseClient();


  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (!user) {
    return {
      authorized: false as const,
      reason: "unauthenticated" as const,
    };
  }



  const { data: row } = await supabase
    .from("profiles")
    .select("id, tenant_id, email, full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>();



  if (!row || !allowedRoles.includes(row.role)) {
    return {
      authorized: false as const,
      reason: "forbidden" as const,
    };
  }

  const profile: Profile = {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };

  return {
    authorized: true as const,
    profile,
  };
}