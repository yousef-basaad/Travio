import { NextResponse } from "next/server";
import { bookingsService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/bookings/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses bookingsService.getById unchanged (the exact same method the
// dashboard's own booking detail route calls) - bookings_customer_access
// RLS makes a booking that isn't this customer's own look identical to a
// nonexistent one, same "RLS hides it, route returns 404" convention
// every other detail route in this codebase already follows.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
