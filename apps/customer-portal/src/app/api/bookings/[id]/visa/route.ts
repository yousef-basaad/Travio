import { NextResponse } from "next/server";
import { bookingsService, visaApplicationsService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/bookings/:id/visa";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors bookings/:id/flights/route.ts's parent-lookup convention.
// visaApplicationsService.listByBooking is called with no options
// (the role-aware .or() branch only applies to staff sessions) -
// visa_applications_customer_access (Product-6 migration) is the actual
// boundary. A visa application that exists but isn't yet linked to this
// booking/customer is simply absent from the result, which is exactly
// "only if already linked and authorized."
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const visaApplications = await visaApplicationsService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(visaApplications);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
