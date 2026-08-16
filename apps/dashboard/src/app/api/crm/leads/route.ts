import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { crmLeadsService } from "@travio/api";
import { requireLeadsAccess } from "@/lib/auth/require-domain-access";
import { createCrmLeadSchema } from "./_lib/schemas";

const ROUTE = "/api/crm/leads";

export async function GET() {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  try {
    const leads = await crmLeadsService.list(auth.access.supabase, auth.access.tenantId, {
      role: auth.access.role,
      userId: auth.access.userId,
    });
    return NextResponse.json(leads);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request) {
  const auth = await requireLeadsAccess();
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
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
