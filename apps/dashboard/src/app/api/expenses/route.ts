import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { expenseService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { createExpenseSchema } from "./_lib/schemas";

const ROUTE = "/api/expenses";

// Tenant-wide list - backs the Finance workspace's ExpenseOverview. RLS
// (tenant_id = current_tenant_id()) scopes this, same as every other
// list route.
export async function GET() {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  try {
    const expenses = await expenseService.list(auth.access.supabase);
    return NextResponse.json(expenses);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // tenantId always comes from the authenticated session - never from
    // the request body.
    const expense = await expenseService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
