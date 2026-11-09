import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { brandingService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { saveBrandingSchema } from "./_lib/schemas";

const ROUTE = "/api/branding";

// Always the caller's own agency; no id is ever taken from the client.
export async function GET() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(await brandingService.get(auth.access.supabase, auth.access.tenantId));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = saveBrandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await brandingService.save(auth.access.supabase, auth.access.tenantId, parsed.data);
    return NextResponse.json(await brandingService.get(auth.access.supabase, auth.access.tenantId));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
