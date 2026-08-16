import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { crmLeadsService } from "@travio/api";
import { requireLeadsAccess } from "@/lib/auth/require-domain-access";
import { updateCrmLeadSchema } from "../_lib/schemas";

const ROUTE = "/api/crm/leads/:id";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const lead = await crmLeadsService.getById(auth.access.supabase, id);
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateCrmLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await crmLeadsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const lead = await crmLeadsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(lead);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Soft delete only - never issues a hard DELETE against the row, per
// ADR-0004 ("a lead is never deleted").
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await crmLeadsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await crmLeadsService.softDelete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
