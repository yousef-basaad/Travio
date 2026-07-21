import { NextResponse } from "next/server";
import { crmLeadsService, crmNotesService } from "@travio/api";
import { requireCrmAccess } from "../../_lib/require-crm-access";
import { createCrmNoteSchema } from "../../_lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Existence check mirrors leads/[id]/route.ts's own GET/PATCH/DELETE -
    // RLS makes a lead in another tenant look identical to a nonexistent
    // one, so this also never leaks cross-tenant existence.
    const lead = await crmLeadsService.getById(auth.access.supabase, id);
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const notes = await crmNotesService.listByLead(auth.access.supabase, id);
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createCrmNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const lead = await crmLeadsService.getById(auth.access.supabase, id);
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // tenantId/leadId/createdBy all come from the URL param and the
    // authenticated session - never from the request body.
    const note = await crmNotesService.create(auth.access.supabase, {
      tenantId: auth.access.tenantId,
      leadId: id,
      body: parsed.data.body,
      createdBy: auth.access.userId,
    });
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
