import { NextResponse } from "next/server";
import { invoiceService, paymentService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/invoices/:id/payments";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors apps/dashboard's own invoices/:id/payments GET handler - look
// up the parent invoice first (RLS makes another customer's invoice
// look identical to a nonexistent one), then list its payments.
// payments_customer_access (Product-6 migration) additionally scopes
// the payments query itself. Read-only: no POST here, this phase has no
// payment actions or online payment.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const invoice = await invoiceService.getById(auth.access.supabase, id);
    if (!invoice) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const payments = await paymentService.listByInvoice(auth.access.supabase, id);
    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
