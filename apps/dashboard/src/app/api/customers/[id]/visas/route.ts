import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService, visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";
import { createVisaSchema } from "../../_lib/schemas";

const ROUTE = "/api/customers/:id/visas";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and customers/_lib/schemas.ts -
// both are CRM-wide/customer-wide, not visa-specific, same as
// customers/[id]/timeline/route.ts.
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a customer in another tenant look identical to a
    // nonexistent one, same convention as customers/[id]/route.ts.
    const customer = await customerService.getById(auth.access.supabase, id);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const visas = await visaApplicationsService.listByCustomer(auth.access.supabase, id, {
      role: auth.access.role,
      userId: auth.access.userId,
    });
    return NextResponse.json(visas);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createVisaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const customer = await customerService.getById(auth.access.supabase, id);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // tenantId/customerId/createdBy all come from the URL param and the
    // authenticated session - never from the request body.
    const visa = await visaApplicationsService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
      customerId: id,
      createdBy: auth.access.userId,
    });
    return NextResponse.json(visa, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
