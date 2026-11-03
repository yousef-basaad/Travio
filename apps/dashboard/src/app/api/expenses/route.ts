import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { expenseService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { parsePageRequest } from "@/lib/api/page-request";
import { createExpenseSchema } from "./_lib/schemas";

const ROUTE = "/api/expenses";

// Tenant-wide list for the Finance workspace. RLS (tenant_id =
// current_tenant_id() plus the finance role checks) scopes this. ?page=
// returns one page ({ items, total, page, pageSize }); without it, the
// full list as before (see lib/api/page-request.ts).
export async function GET(request: Request) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const pageParse = parsePageRequest(new URL(request.url).searchParams);

  try {
    if (pageParse.kind === "invalid") {
      return NextResponse.json({ error: "invalid_input", issues: pageParse.issues }, { status: 400 });
    }
    if (pageParse.kind === "page") {
      const page = await expenseService.listPage(auth.access.supabase, auth.access.tenantId, pageParse.request);
      return NextResponse.json(page);
    }

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
