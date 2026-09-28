import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, customerService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";
import { updateBookingSchema } from "../_lib/schemas";

const ROUTE = "/api/bookings/:id";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a booking in another tenant look identical to a
    // nonexistent one, same convention as customers/[id]/route.ts.
    const booking = await bookingsService.getById(auth.access.supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = updateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await bookingsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Same as POST - a re-pointed customerId is never trusted as-is,
    // resolved through the caller's own (RLS-scoped) client first.
    if (parsed.data.customerId) {
      const customer = await customerService.getById(auth.access.supabase, parsed.data.customerId);
      if (!customer) {
        return NextResponse.json({ error: "invalid_customer" }, { status: 400 });
      }
    }

    const booking = await bookingsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Soft delete only - bookingsService.softDelete() sets deleted_at, it
// never issues a hard DELETE (no delete grant exists on bookings either).
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await bookingsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await bookingsService.softDelete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
