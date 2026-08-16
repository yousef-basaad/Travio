import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { documentService } from "@travio/api";
import { requireDocumentsAccess } from "@/lib/auth/require-domain-access";
import { updateDocumentSchema } from "../_lib/schemas";

const ROUTE = "/api/documents/:id";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // RLS makes a document in another tenant look identical to a
    // nonexistent one, same convention as every other [id] route.
    const existing = await documentService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const document = await documentService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(document);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

// Soft delete only - storage object cleanup is out of scope for this
// phase (see the migration's own comment). The row is hidden from every
// list/getById call via deleted_at, matching invoiceService's
// softDelete/restore shape (restore isn't exposed yet - no UI needs it).
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await documentService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const document = await documentService.softDelete(auth.access.supabase, id);
    return NextResponse.json(document);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
