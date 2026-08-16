import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { bookingNotesService } from "@travio/api";
import { requireBookingsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/booking-notes/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors crm/notes/[id]/route.ts exactly, retargeted at booking notes.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireBookingsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // bookingNotesService.delete() has no existence check of its own (no
    // getById exists for notes) - deleting a nonexistent or cross-tenant
    // id (RLS hides it either way) affects zero rows without erroring,
    // so this is treated as a successful, idempotent delete.
    await bookingNotesService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
