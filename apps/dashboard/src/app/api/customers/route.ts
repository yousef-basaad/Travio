import { NextResponse } from "next/server";
import { customerService } from "@travio/api";
import { requireCrmAccess } from "../crm/leads/_lib/require-crm-access";
import { createCustomerSchema } from "./_lib/schemas";

// Reuses crm/leads/_lib/require-crm-access.ts - it's a CRM-wide access
// bootstrap (auth + tenant + client), not leads-specific, same as
// crm/notes/[id]/route.ts and crm/activities/[id]/route.ts already do.

export async function GET() {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  try {
    const customers = await customerService.list(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireCrmAccess();
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
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
