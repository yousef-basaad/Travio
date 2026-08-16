import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, bookingNotesService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";
import { createBookingNoteSchema } from "../../_lib/schemas";

const ROUTE = "/api/bookings/:id/notes";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors crm/leads/[id]/notes/route.ts exactly, retargeted at bookings.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Existence check mirrors bookings/[id]/route.ts's own GET/PATCH/
    // DELETE - RLS makes a booking in another tenant (or one this
    // sales_agent isn't assigned to) look identical to a nonexistent one.
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const notes = await bookingNotesService.listByBooking(auth.access.supabase, id);
    return NextResponse.json(notes);
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

  const parsed = createBookingNoteSchema.safeParse(body);
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
    const note = await bookingNotesService.create(auth.access.supabase, {
      tenantId: auth.access.tenantId,
      bookingId: id,
      body: parsed.data.body,
      createdBy: auth.access.userId,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
