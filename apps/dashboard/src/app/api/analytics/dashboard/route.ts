import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { analyticsService } from "@travio/api";
import { requireAnalyticsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/analytics/dashboard";

// Read-only, tenant-scoped via the caller's own RLS-backed client - never
// service_role, same convention as every other dashboard API route.
export async function GET() {
  const auth = await requireAnalyticsAccess();
  if (!auth.ok) return auth.response;

  try {
    const stats = await analyticsService.getDashboardStats(auth.access.supabase);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
