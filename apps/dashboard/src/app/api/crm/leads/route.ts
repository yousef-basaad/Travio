import { NextResponse } from "next/server";
import { crmLeadsService } from "@travio/api";
import { requireCrmAccess } from "./_lib/require-crm-access";
import { createCrmLeadSchema } from "./_lib/schemas";

export async function GET() {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  try {
    const leads = await crmLeadsService.list(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(leads);
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
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createCrmLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const lead = await crmLeadsService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
    });
    return NextResponse.json(lead, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
