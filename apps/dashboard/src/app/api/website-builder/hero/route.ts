import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { agencySiteService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { MAX_LOGO_BYTES, detectImage } from "@/lib/branding/detect-image";

const ROUTE = "/api/website-builder/hero";

export async function POST(request: Request) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(bytes);
  if (!image) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  try {
    await agencySiteService.setHero(auth.access.supabase, auth.access.tenantId, bytes, image);
    return NextResponse.json(await agencySiteService.getEditor(auth.access.supabase, auth.access.tenantId));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function DELETE() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    await agencySiteService.removeHero(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(await agencySiteService.getEditor(auth.access.supabase, auth.access.tenantId));
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
