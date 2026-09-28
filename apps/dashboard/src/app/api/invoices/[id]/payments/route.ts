import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { invoiceService, paymentService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { createPaymentSchema } from "../../_lib/schemas";

const ROUTE = "/api/invoices/:id/payments";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and invoices/_lib/schemas.ts -
// both are finance-wide, not payments-specific, same as
// invoices/[id]/items/route.ts reusing invoices' own _lib.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes an invoice in another tenant look identical to a
    // nonexistent one, same convention as invoices/[id]/route.ts.
    const invoice = await invoiceService.getById(auth.access.supabase, id);
    if (!invoice) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const payments = await paymentService.listByInvoice(auth.access.supabase, id);
    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const invoice = await invoiceService.getById(auth.access.supabase, id);
    if (!invoice) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // tenantId/invoiceId both come from the authenticated session and the
    // URL param - never from the request body.
    const payment = await paymentService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
      invoiceId: id,
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
