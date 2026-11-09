import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { financeInsightsService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/finance/insights";

// The Finance page's monthly expenses, expenses by category and overdue
// invoices, computed in Postgres under the caller's RLS.
export async function GET() {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  try {
    const insights = await financeInsightsService.get(auth.access.supabase);
    return NextResponse.json(insights);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
