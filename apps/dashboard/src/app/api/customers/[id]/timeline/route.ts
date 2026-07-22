import { NextResponse } from "next/server";
import { customerTimelineService } from "@travio/api";
import { requireCrmAccess } from "../../../crm/leads/_lib/require-crm-access";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses crm/leads/_lib/require-crm-access.ts - it's a CRM-wide access
// bootstrap, not leads-specific, same as every other customers/crm route
// already does.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // No separate customer-existence check here - same style as
    // crm/leads/[id]/timeline/route.ts: customerTimelineService.
    // listByCustomer() already composes customerService.getById()
    // internally, so re-checking here would just duplicate that same
    // query. A nonexistent or cross-tenant customer (RLS hides it either
    // way) simply yields an empty timeline, not a 404 - this route has no
    // business logic of its own to decide otherwise.
    const timeline = await customerTimelineService.listByCustomer(auth.access.supabase, id);
    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
