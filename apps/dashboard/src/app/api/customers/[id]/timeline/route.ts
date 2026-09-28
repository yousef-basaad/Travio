import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerTimelineService } from "@travio/api";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/customers/:id/timeline";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap, same as every other
// customers/crm route already does.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomersAccess();
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
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
