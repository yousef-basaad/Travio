import { NextResponse } from "next/server";
import { crmLeadsService, crmActivitiesService } from "@travio/api";
import { requireCrmAccess } from "../../_lib/require-crm-access";
import { createCrmActivitySchema } from "../../_lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCrmAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // Existence check mirrors leads/[id]/notes/route.ts's own GET - RLS
    // makes a lead in another tenant look identical to a nonexistent one,
    // so this also never leaks cross-tenant existence.
    const lead = await crmLeadsService.getById(auth.access.supabase, id);
    if (!lead) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const activities = await crmActivitiesService.listByLead(auth.access.supabase, id);
    return NextResponse.json(activities);
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

  const parsed = createCrmActivitySchema.safeParse(body);
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

    // tenantId/leadId/performedBy all come from the URL param and the
    // authenticated session - never from the request body.
    const activity = await crmActivitiesService.create(auth.access.supabase, {
      tenantId: auth.access.tenantId,
      leadId: id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      performedBy: auth.access.userId,
      performedAt: parsed.data.performedAt,
    });
    return NextResponse.json(activity, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
