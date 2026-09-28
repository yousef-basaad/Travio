import { createServerSupabaseClient } from "@travio/database/server";
import type { UserRole, Profile } from "@travio/types";
import type { Database } from "@travio/database";
import { logger } from "@travio/logger";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "tenant_id" | "customer_id" | "email" | "full_name" | "role"
>;

// PostgREST's error code for ".single() found zero (or more than one)
// rows" - with this query (.eq("id", primaryKey)), only "zero rows" is
// actually reachable, i.e. "no profile exists for this user yet". Every
// other error code is a genuine query/connection/schema failure, not an
// authorization outcome.
const NO_ROW_ERROR_CODE = "PGRST116";

export type RequireRoleResult =
  | { authorized: true; profile: Profile }
  | { authorized: false; reason: "unauthenticated" }
  | { authorized: false; reason: "forbidden" }
  // Stabilization Phase 1: distinct from "forbidden" - the profile
  // query itself failed (DB outage, schema mismatch, RLS
  // misconfiguration, ...), not "this user has no access". Every
  // caller must branch on this separately rather than folding it into
  // "forbidden", which would misreport a system fault as a permissions
  // decision. See require-role.test.ts and each app's layout.tsx/
  // require-domain-access.ts for how this is handled.
  | { authorized: false; reason: "error" };

export async function requireRole(allowedRoles: UserRole[]): Promise<RequireRoleResult> {
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

  const { data: row, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, customer_id, email, full_name, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  // A real query failure must never be silently reported as "forbidden" -
  // that would hide an outage/misconfiguration behind a permissions
  // message and make it invisible to monitoring. Logged with enough
  // structure to diagnose (action, the caller's userId, the raw
  // Postgrest error shape - message/details/hint/code, never a secret)
  // via @travio/logger, which redacts any password/token/secret/
  // service_role/cookie/jwt/refresh/access-key key it ever sees
  // regardless. Nothing here is returned to the browser beyond the
  // "error" tag itself - see require-domain-access.ts/
  // require-customer-access.ts for how API routes turn that into a safe
  // 500 response.
  if (error && error.code !== NO_ROW_ERROR_CODE) {
    logger.error({
      message: "requireRole: profile lookup failed",
      action: "requireRole",
      userId: user.id,
      error,
    });
    return {
      authorized: false as const,
      reason: "error" as const,
    };
  }

  if (!row || !allowedRoles.includes(row.role)) {
    return {
      authorized: false as const,
      reason: "forbidden" as const,
    };
  }

  const profile: Profile = {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
  };

  return {
    authorized: true as const,
    profile,
  };
}
