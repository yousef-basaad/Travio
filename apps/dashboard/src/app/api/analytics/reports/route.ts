import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { reportsService } from "@travio/api";
import { requireAnalyticsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/analytics/reports";

// The Reports page numbers (reports_overview + this year vs last year),
// computed in Postgres under the caller's RLS.
export async function GET() {
  const auth = await requireAnalyticsAccess();
  if (!auth.ok) return auth.response;

  try {
    const overview = await reportsService.getOverview(auth.access.supabase);
    return NextResponse.json(overview);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
