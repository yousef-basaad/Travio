import { NextResponse } from "next/server";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";

const CRM_LEAD_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
] as const;

type CrmAccess = {
  tenantId: string;
  userId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
};

type CrmAccessResult = { ok: true; access: CrmAccess } | { ok: false; response: NextResponse };

// Shared bootstrap for every /api/crm/leads route. Authenticates via the
// existing requireRole() guard (the same helper the (dashboard)/(admin)/
// (portal) layouts already use) - no new auth mechanism, just composition.
// Ownership-based (assigned_to) scoping is explicitly deferred by ADR-0004;
// this only enforces the tenant boundary, same as every other RLS-backed
// table today.
export async function requireCrmAccess(): Promise<CrmAccessResult> {
  const result = await requireRole([...CRM_LEAD_ROLES]);

  if (!result.authorized) {
    const status = result.reason === "unauthenticated" ? 401 : 403;
    return {
      ok: false,
      response: NextResponse.json({ error: result.reason }, { status }),
    };
  }

  if (!result.profile.tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "no_tenant_context" }, { status: 403 }),
    };
  }

  const supabase = await createServerSupabaseClient();

  return {
    ok: true,
    access: { tenantId: result.profile.tenantId, userId: result.profile.id, supabase },
  };
}
