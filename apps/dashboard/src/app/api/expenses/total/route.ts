import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { expenseService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/expenses/total";

// { total } - the sum of every expense the caller can see, computed in
// Postgres so it stays right past the 1000-row response cap. Backs the
// Finance page's "Total Expenses" and "Net Income".
export async function GET() {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  try {
    const total = await expenseService.total(auth.access.supabase);
    return NextResponse.json({ total });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
