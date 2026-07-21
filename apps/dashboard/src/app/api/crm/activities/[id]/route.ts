import { NextResponse } from "next/server";
import { crmActivitiesService } from "@travio/api";
import { requireCrmAccess } from "../../leads/_lib/require-crm-access";
import { updateCrmActivitySchema } from "../../leads/_lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses leads/_lib/require-crm-access.ts and schemas.ts - both are
// CRM-wide, not leads-specific, same as crm/notes/[id]/route.ts already
// does.
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateCrmActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // No pre-existence check - crmActivitiesService has no getById (only
    // listByLead/create/update/delete, per this issue's scope), so a
    // nonexistent or cross-tenant id (RLS hides it either way) falls
    // through to the generic 500 below rather than a clean 404, same
    // trade-off crm_notes' delete route already accepts.
    const activity = await crmActivitiesService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(activity);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await crmActivitiesService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
