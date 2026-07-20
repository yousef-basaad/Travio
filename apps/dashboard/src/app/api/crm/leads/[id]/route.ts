import { NextResponse } from "next/server";
import { crmLeadsService } from "@travio/api";
import { requireCrmAccess } from "../_lib/require-crm-access";
import { updateCrmLeadSchema } from "../_lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const lead = await crmLeadsService.getById(auth.access.supabase, id);
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateCrmLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await crmLeadsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const lead = await crmLeadsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// Soft delete only - never issues a hard DELETE against the row, per
// ADR-0004 ("a lead is never deleted").
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await crmLeadsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await crmLeadsService.softDelete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
