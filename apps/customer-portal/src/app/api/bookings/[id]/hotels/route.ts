import { NextResponse } from "next/server";
import { bookingsService, bookingHotelsService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/bookings/:id/hotels";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors bookings/:id/flights/route.ts exactly - same parent-lookup
// convention, scoped by booking_hotels_customer_access (Product-6
// migration).
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const hotels = await bookingHotelsService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(hotels);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
