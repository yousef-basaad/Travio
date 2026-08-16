import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { crmTimelineService } from "@travio/api";
import { requireLeadsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/crm/leads/:id/timeline";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
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
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
