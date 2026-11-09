import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { agencySiteService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { saveSiteSchema } from "./_lib/schemas";

const ROUTE = "/api/website-builder";

// Always the caller's own agency; no id is ever taken from the client.
export async function GET() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    const editor = await agencySiteService.getEditor(auth.access.supabase, auth.access.tenantId);
    if (!editor) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(editor);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = saveSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await agencySiteService.save(auth.access.supabase, auth.access.tenantId, parsed.data);
    return NextResponse.json(await agencySiteService.getEditor(auth.access.supabase, auth.access.tenantId));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PUT", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
