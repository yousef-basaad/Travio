import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/visa-applications";

// The Visa Center workspace list: every visa application the caller may
// see in its tenant, with the customer's name. Which rows that is comes
// from RLS (managers: all; visa_officer: its own + unassigned;
// sales_agent: those of customers it can see), not from this route.
export async function GET() {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  try {
    const visas = await visaApplicationsService.listForTenant(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(visas);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
