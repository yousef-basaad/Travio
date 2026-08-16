import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { crmNotesService } from "@travio/api";
import { requireLeadsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/crm/notes/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap (auth + tenant + client).
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // crmNotesService.delete() has no existence check of its own (no
    // getById exists for notes) - deleting a nonexistent or cross-tenant
    // id (RLS hides it either way) affects zero rows without erroring,
    // so this is treated as a successful, idempotent delete.
    await crmNotesService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
