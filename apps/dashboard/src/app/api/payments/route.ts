import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { paymentService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { parsePageRequest } from "@/lib/api/page-request";

const ROUTE = "/api/payments";

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
      const page = await paymentService.listPage(auth.access.supabase, auth.access.tenantId, pageParse.request);
      return NextResponse.json(page);
    }

    const payments = await paymentService.list(auth.access.supabase);
    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
