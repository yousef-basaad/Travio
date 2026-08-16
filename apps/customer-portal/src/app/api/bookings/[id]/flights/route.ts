import { NextResponse } from "next/server";
import { bookingsService, bookingFlightsService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/bookings/:id/flights";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses bookingFlightsService.listByBooking unchanged - same "look up
// the parent booking first, 404 if RLS hides it" convention as
// /api/bookings/:id itself. booking_flights_customer_access (Product-6
// migration) additionally scopes the flights query itself, so even a
// guessed bookingId that somehow passed the parent lookup could never
// surface another customer's flights.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const flights = await bookingFlightsService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(flights);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
