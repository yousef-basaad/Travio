import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { invoiceService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/invoices/:id/restore";

type RouteParams = { params: Promise<{ id: string }> };

// No pre-existence check via invoiceService.getById() - it filters out
// soft-deleted rows by design, so it would always report a deleted
// invoice as "not found" right before restoring it. Same trade-off as
// flights/[id]/route.ts's PATCH (no getById to check against): a
// nonexistent id simply falls through to the generic 500 below.
export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const invoice = await invoiceService.restore(auth.access.supabase, id);
    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
