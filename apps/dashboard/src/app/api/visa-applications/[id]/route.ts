import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";
import { updateVisaSchema } from "../../customers/_lib/schemas";

const ROUTE = "/api/visa-applications/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and customers/_lib/schemas.ts -
// both are CRM-wide/customer-wide, not visa-specific, same as
// flights/[id]/route.ts reusing bookings' own _lib.
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateVisaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // No pre-existence check - visaApplicationsService has no getById
    // (only listByCustomer/listByBooking/create/update/delete), same
    // trade-off flights/[id]/route.ts's PATCH already accepts.
    const visa = await visaApplicationsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(visa);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await visaApplicationsService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
