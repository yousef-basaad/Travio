import { NextResponse } from "next/server";
import { crmNotesService } from "@travio/api";
import { requireCrmAccess } from "../../leads/_lib/require-crm-access";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses leads/_lib/require-crm-access.ts - it's a CRM-wide access
// bootstrap (auth + tenant + client), not leads-specific, even though it
// currently lives under the leads route tree.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // crmNotesService.delete() has no existence check of its own (no
    // getById exists for notes) - deleting a nonexistent or cross-tenant
    // id (RLS hides it either way) affects zero rows without erroring,
    // so this is treated as a successful, idempotent delete.
    await crmNotesService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
