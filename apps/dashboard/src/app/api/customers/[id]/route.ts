import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService } from "@travio/api";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";
import { updateCustomerSchema } from "../_lib/schemas";

const ROUTE = "/api/customers/:id";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a customer in another tenant look identical to a
    // nonexistent one, so this never leaks cross-tenant existence -
    // same convention as leads/[id]/route.ts.
    const customer = await customerService.getById(auth.access.supabase, id);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await customerService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const customer = await customerService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Soft delete only - customerService.delete() sets deleted_at, it never
// issues a hard DELETE (see customer.service.ts for why).
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await customerService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await customerService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
