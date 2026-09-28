import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { notificationService } from "@travio/api";
import { requireNotificationAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/notifications/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Mark-as-read only - no other field is ever editable from the client,
// so this doesn't take a body/schema at all, unlike every other PATCH
// route in this app.
export async function PATCH(_request: Request, { params }: RouteParams) {
  const auth = await requireNotificationAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS (notifications_select_own: user_id = auth.uid()) makes another
    // user's notification look identical to a nonexistent one, same
    // convention as every other [id] route.
    const existing = await notificationService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const notification = await notificationService.markRead(auth.access.supabase, id);
    return NextResponse.json(notification);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
