import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService, bookingsService, invoiceService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { updateInvoiceSchema } from "../_lib/schemas";

const ROUTE = "/api/invoices/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Not explicitly listed in this issue's API spec, but useInvoice() (React
// Query) and invoiceService.getById() (both explicitly requested) need a
// single-invoice fetch path - adding it here rather than a new route
// file, since PATCH/DELETE already live at this exact path.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const invoice = await invoiceService.getById(auth.access.supabase, id);
    if (!invoice) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await invoiceService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Same as POST - a re-pointed customerId/bookingId is never trusted
    // as-is, resolved through the caller's own (RLS-scoped) client first.
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

    const invoice = await invoiceService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Soft delete only - invoiceService.softDelete() sets deleted_at, it
// never issues a hard DELETE.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await invoiceService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await invoiceService.softDelete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
