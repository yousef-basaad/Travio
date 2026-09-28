import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { paymentService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/payments";

// Tenant-wide list - backs the Finance workspace's PaymentStatus. RLS
// (tenant_id = current_tenant_id()) scopes this, same as every other
// list route.
export async function GET() {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  try {
    const payments = await paymentService.list(auth.access.supabase);
    return NextResponse.json(payments);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
