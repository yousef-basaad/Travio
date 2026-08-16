import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService } from "@travio/api";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";
import { createCustomerSchema } from "./_lib/schemas";

const ROUTE = "/api/customers";

// Reuses the shared dashboard auth bootstrap (auth + tenant + client).

export async function GET() {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  try {
    const customers = await customerService.list(auth.access.supabase, auth.access.tenantId, {
      role: auth.access.role,
      userId: auth.access.userId,
    });
    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // tenantId always comes from the authenticated session - never from
    // the request body.
    const customer = await customerService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
