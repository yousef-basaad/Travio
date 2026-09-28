import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { subscriptionService, planLimitsService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/subscription";

// Response shape (subscription/plan/features/usage/usageSnapshot/limits)
// is declared locally in features/subscription/api/subscription.api.ts,
// not exported from here - Next.js route files may only export
// recognized handler functions/route config, never arbitrary types.

// Read-only, by this phase's explicit scope ("Do not implement
// payments... read-only subscription view") - no POST/PATCH exists
// here. Product-7 gives every tenant a real, persisted subscriptions
// row (create_agency() + a one-time backfill, see that migration), so
// { subscription: null, plan: null } is now the defensive fallback
// rather than the everyday case - the UI still renders it as a real
// empty state, not an error, in case it's ever hit.
export async function GET() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    const subscription = await subscriptionService.getLatestByTenant(
      auth.access.supabase,
      auth.access.tenantId,
    );

    const [plan, usage, { usage: usageSnapshot, limits }] = await Promise.all([
      subscription
        ? subscriptionService.getPlanById(auth.access.supabase, subscription.planId)
        : Promise.resolve(null),
      subscriptionService.listUsageByTenant(auth.access.supabase, auth.access.tenantId),
      planLimitsService.getAllLimits(auth.access.supabase, auth.access.tenantId),
    ]);

    const features = subscription
      ? await subscriptionService.listPlanFeatures(auth.access.supabase, subscription.planId)
      : [];

    return NextResponse.json({ subscription, plan, features, usage, usageSnapshot, limits });
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "GET",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}
