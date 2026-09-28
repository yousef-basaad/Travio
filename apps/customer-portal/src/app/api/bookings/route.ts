import { NextResponse } from "next/server";
import { bookingsService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/bookings";

// Reuses bookingsService.listByCustomer (packages/api, added this
// phase) - bookings_customer_access RLS (Product-5 migration) is the
// real boundary, the .eq("customer_id", ...) inside that service is
// defense-in-depth, same convention every dashboard route already
// documents for its own list()/listByX() calls.
export async function GET() {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  try {
    const bookings = await bookingsService.listByCustomer(auth.access.supabase, auth.access.customerId);
    return NextResponse.json(bookings);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
