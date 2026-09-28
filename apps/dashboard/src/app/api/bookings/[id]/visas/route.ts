import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/bookings/:id/visas";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors customers/[id]/visas/route.ts's GET handler exactly, retargeted
// at bookings - visaApplicationsService.listByBooking already existed
// (used by visaApplicationsService.update's own tests) but had no route
// calling it anywhere in the app. Read-only: visa applications are still
// created/edited/deleted from the Customer 360 tab only (see VisaList's
// own comment) - this just makes an already-linked visa visible from the
// booking it's for too. Gated by requireVisaAccess (not
// requireBookingsAccess) - visa data is gated by the visa domain's own
// role set regardless of which entity it's nested under, same as
// customers/[id]/visas/route.ts.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a booking in another tenant (or one this sales_agent
    // isn't assigned to) look identical to a nonexistent one, same
    // convention as bookings/[id]/route.ts.
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const visas = await visaApplicationsService.listByBooking(auth.access.supabase, id, {
      role: auth.access.role,
      userId: auth.access.userId,
    });
    return NextResponse.json(visas);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
