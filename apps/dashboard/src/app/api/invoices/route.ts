import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService, bookingsService, invoiceService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { createInvoiceSchema } from "./_lib/schemas";

const ROUTE = "/api/invoices";

// Tenant-wide list - backs the Finance workspace's InvoiceTable. RLS
// (tenant_id = current_tenant_id()) scopes this, same as every other
// list route; no query params to trust/validate.
export async function GET() {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  try {
    const invoices = await invoiceService.list(auth.access.supabase);
    return NextResponse.json(invoices);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Unlike the nested booking-services routes (flights/hotels/transfers),
// this is a flat top-level resource - customerId/bookingId (if present)
// come from the request body, not a URL param, so they're independently
// re-validated through the caller's own RLS-scoped client below.
export async function POST(request: Request) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // customerId/bookingId are never trusted as-is - resolved through the
    // caller's own (RLS-scoped) client so a customer/booking belonging to
    // another tenant is indistinguishable from a nonexistent one, same
    // convention as POST /api/bookings' customerId check.
    if (parsed.data.customerId) {
      const customer = await customerService.getById(auth.access.supabase, parsed.data.customerId);
      if (!customer) {
        return NextResponse.json({ error: "invalid_customer" }, { status: 400 });
      }
    }

    if (parsed.data.bookingId) {
      const booking = await bookingsService.getById(auth.access.supabase, parsed.data.bookingId);
      if (!booking) {
        return NextResponse.json({ error: "invalid_booking" }, { status: 400 });
      }
    }

    // tenantId always comes from the authenticated session - never from
    // the request body.
    const invoice = await invoiceService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
