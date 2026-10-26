import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService } from "@travio/api";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";
import { createCustomerSchema } from "./_lib/schemas";
import { parsePageRequest } from "@/lib/api/page-request";

const ROUTE = "/api/customers";

// Reuses the shared dashboard auth bootstrap (auth + tenant + client).

// ?page= returns one page ({ items, total, page, pageSize }); without it,
// the full list as before (see lib/api/page-request.ts).
export async function GET(request: Request) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  const pageParse = parsePageRequest(new URL(request.url).searchParams);

  try {
    if (pageParse.kind === "invalid") {
      return NextResponse.json({ error: "invalid_input", issues: pageParse.issues }, { status: 400 });
    }
    if (pageParse.kind === "page") {
      const page = await customerService.listPage(auth.access.supabase, auth.access.tenantId, pageParse.request, {
        role: auth.access.role,
        userId: auth.access.userId,
      });
      return NextResponse.json(page);
    }

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
