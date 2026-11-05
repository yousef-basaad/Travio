import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/visa-applications/stats";

// The Visa Center's numbers (counts per status, this/last month, top
// types and countries), over the same applications RLS lets the caller
// see in the list.
export async function GET() {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  try {
    const stats = await visaApplicationsService.getCenterStats(auth.access.supabase);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
