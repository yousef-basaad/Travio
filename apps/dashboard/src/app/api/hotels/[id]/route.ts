import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingHotelsService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";
import { updateHotelSchema } from "../../bookings/_lib/schemas";

const ROUTE = "/api/hotels/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and bookings/_lib/schemas.ts -
// both are CRM-wide/booking-wide, not hotels-specific, same as
// flights/[id]/route.ts.
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateHotelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // No pre-existence check - bookingHotelsService has no getById (only
    // listByBooking/create/update/delete), same trade-off
    // flights/[id]/route.ts's PATCH already accepts.
    const hotel = await bookingHotelsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(hotel);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await bookingHotelsService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
