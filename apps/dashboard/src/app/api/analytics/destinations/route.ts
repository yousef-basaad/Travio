import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { analyticsService } from "@travio/api";
import { requireAnalyticsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/analytics/destinations";

// Top destination countries by live bookings. Read-only, tenant-scoped
// via the caller's own RLS-backed client, like the other analytics routes.
export async function GET() {
  const auth = await requireAnalyticsAccess();
  if (!auth.ok) return auth.response;

  try {
    const destinations = await analyticsService.getTopDestinations(auth.access.supabase);
    return NextResponse.json({ destinations });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
