import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { tenantService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { updateTenantSchema } from "./_lib/schemas";

const ROUTE = "/api/tenant";

// No :id param - this always resolves to the caller's own tenant
// (auth.access.tenantId), same reasoning as every other "my own X"
// endpoint in this app (e.g. notifications' listByUser) never accepting
// an id from the client.
export async function GET() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    const tenant = await tenantService.getById(auth.access.supabase, auth.access.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(tenant);
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "GET",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = updateTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // tenants_update_owner RLS re-checks current_role() = 'agency_owner'
    // itself - requireAgencyOwnerAccess also allows travio_admin, whose
    // update would be rejected at the RLS layer (no cross-tenant admin
    // write path exists here, by design - the admin app is where a
    // travio_admin operates cross-tenant, not this route).
    const tenant = await tenantService.update(auth.access.supabase, auth.access.tenantId, parsed.data);
    return NextResponse.json(tenant);
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "PATCH",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}
