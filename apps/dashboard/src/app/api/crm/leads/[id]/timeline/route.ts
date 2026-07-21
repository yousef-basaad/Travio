import { NextResponse } from "next/server";
import { crmTimelineService } from "@travio/api";
import { requireCrmAccess } from "../../_lib/require-crm-access";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // No separate lead-existence check here - unlike notes/activities'
    // GET, crmTimelineService.listByLead() already composes
    // crmLeadsService.getById() internally, so re-checking here would
    // just duplicate that same query. A nonexistent or cross-tenant lead
    // (RLS hides it either way) simply yields an empty timeline, not a
    // 404 - this route has no business logic of its own to decide
    // otherwise.
    const timeline = await crmTimelineService.listByLead(auth.access.supabase, id);
    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
