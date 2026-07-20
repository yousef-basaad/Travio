import { createServerSupabaseClient } from "@travio/database/server";
import type { UserRole } from "@travio/types";
import type { Database } from "@travio/database";


type Profile = Database["public"]["Tables"]["profiles"]["Row"];


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



  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "tenant_id">>();



  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      authorized: false as const,
      reason: "forbidden" as const,
    };
  }



  return {
    authorized: true as const,
    profile,
  };
}