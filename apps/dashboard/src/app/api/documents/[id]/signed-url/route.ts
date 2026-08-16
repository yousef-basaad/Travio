import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { documentService } from "@travio/api";
import { requireDocumentsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/documents/:id/signed-url";

type RouteParams = { params: Promise<{ id: string }> };

// Short-lived (60s) signed URL for preview/download - generated fresh
// per request, never cached/stored, since the bucket is private. Uses
// the caller's own session-scoped client, same as every other query
// here - Storage's own RLS (documents_bucket_tenant_select) still
// applies, so this can't produce a URL for another tenant's object even
// if the row lookup below were somehow bypassed.
const SIGNED_URL_EXPIRY_SECONDS = 60;

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const document = await documentService.getById(auth.access.supabase, id);
    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data, error } = await auth.access.supabase.storage
      .from("documents")
      .createSignedUrl(document.filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data) {
      return handleApiError(error ?? new Error("createSignedUrl returned no data"), {
        route: ROUTE,
        action: "GET",
        tenantId: auth.access.tenantId,
        userId: auth.access.userId,
      });
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
