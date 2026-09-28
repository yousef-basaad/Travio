import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { notificationService } from "@travio/api";
import { requireNotificationAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/notifications/mark-all-read";

// Dedicated action route (not a bulk PATCH /api/notifications), same
// convention as POST /api/invoices/[id]/restore - a named action reads
// more clearly than an implicit "PATCH with no id means bulk" rule.
export async function POST() {
  const auth = await requireNotificationAccess();
  if (!auth.ok) return auth.response;

  try {
    await notificationService.markAllRead(auth.access.supabase, auth.access.userId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
