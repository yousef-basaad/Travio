import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingTimelineService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/bookings/:id/timeline";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap (auth + tenant + client),
// same as bookings/route.ts and bookings/[id]/route.ts.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // No separate booking-existence check here - a nonexistent or
    // cross-tenant booking (RLS hides it either way) simply yields an
    // empty timeline, same convention as crm/leads/[id]/timeline/route.ts.
    const timeline = await bookingTimelineService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(timeline);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
