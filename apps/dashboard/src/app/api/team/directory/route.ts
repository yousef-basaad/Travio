import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { teamMembersService } from "@travio/api";
import { requireDashboardAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/team/directory";

// Staff names for showing who a booking, customer, lead or visa is
// assigned to. Open to every dashboard role (GET /api/team is owner-only
// because it carries emails and roles); returns id and name only. Reads
// through the caller's own client, so RLS keeps it to their agency.
export async function GET() {
  const auth = await requireDashboardAccess();
  if (!auth.ok) return auth.response;

  try {
    const members = await teamMembersService.listDirectory(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
