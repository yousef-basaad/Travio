import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingsService, customerService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";
import { createBookingSchema } from "./_lib/schemas";

const ROUTE = "/api/bookings";

// Reuses the shared dashboard auth bootstrap (auth + tenant + client),
// same as customers/route.ts.

export async function GET() {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  try {
    const bookings = await bookingsService.list(auth.access.supabase, auth.access.tenantId, {
      role: auth.access.role,
      userId: auth.access.userId,
    });
    return NextResponse.json(bookings);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // customerId is never trusted as-is - resolve it through the caller's
    // own (RLS-scoped) client so a customer belonging to another tenant is
    // indistinguishable from a nonexistent one, same convention used
    // everywhere else cross-tenant existence must never leak.
    const customer = await customerService.getById(auth.access.supabase, parsed.data.customerId);
    if (!customer) {
      return NextResponse.json({ error: "invalid_customer" }, { status: 400 });
    }

    // tenantId and createdBy always come from the authenticated session -
    // never from the request body.
    const booking = await bookingsService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
      createdBy: auth.access.userId,
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
