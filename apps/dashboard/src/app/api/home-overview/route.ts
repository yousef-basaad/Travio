import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { homeOverviewService } from "@travio/api";
import { requireDashboardAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/home-overview";

// Everything the home page counts, computed in Postgres. RLS decides what
// each role's numbers include, so any dashboard role can ask.
export async function GET() {
  const auth = await requireDashboardAccess();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(await homeOverviewService.get(auth.access.supabase));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
