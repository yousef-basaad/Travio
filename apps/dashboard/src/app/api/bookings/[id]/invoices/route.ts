import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, invoiceService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/bookings/:id/invoices";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap - CRM-wide, not
// invoices-specific, same as bookings/[id]/flights/route.ts and
// bookings/[id]/hotels/route.ts.
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

    const invoices = await invoiceService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(invoices);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
