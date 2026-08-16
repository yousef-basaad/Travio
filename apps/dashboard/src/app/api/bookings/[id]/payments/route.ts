import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, paymentService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/bookings/:id/payments";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors bookings/[id]/invoices/route.ts exactly (same
// requireBookingsAccess gate, same existence-check-then-list shape).
// Read-only: payments are still only ever recorded against a specific
// invoice (PaymentsList, nested in each InvoiceItem) - this just
// surfaces the booking-wide view via paymentService.listByBooking.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a booking in another tenant look identical to a
    // nonexistent one, same convention as bookings/[id]/route.ts.
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const payments = await paymentService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
