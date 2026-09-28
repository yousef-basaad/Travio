import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { notificationService } from "@travio/api";
import { requireNotificationAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/notifications";

// Read-only, current user only - there is no create route: notifications
// are only ever created as a side effect inside other services
// (bookingsService/visaApplicationsService/documentService), never
// directly via this API, per the approved architecture.
export async function GET() {
  const auth = await requireNotificationAccess();
  if (!auth.ok) return auth.response;

  try {
    const notifications = await notificationService.listByUser(
      auth.access.supabase,
      auth.access.userId,
    );
    return NextResponse.json(notifications);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
