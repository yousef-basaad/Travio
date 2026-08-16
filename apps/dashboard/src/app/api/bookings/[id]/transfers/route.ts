import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, bookingTransfersService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";
import { createTransferSchema } from "../../_lib/schemas";

const ROUTE = "/api/bookings/:id/transfers";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and bookings/_lib/schemas.ts -
// both are CRM-wide/booking-wide, not transfers-specific, same as
// bookings/[id]/flights/route.ts and bookings/[id]/hotels/route.ts.
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

    const transfers = await bookingTransfersService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(transfers);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // tenantId/bookingId/createdBy all come from the URL param and the
    // authenticated session - never from the request body.
    const transfer = await bookingTransfersService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
      bookingId: id,
      createdBy: auth.access.userId,
    });
    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
