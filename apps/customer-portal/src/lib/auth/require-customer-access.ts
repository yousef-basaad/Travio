import { NextResponse } from "next/server";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";

export type CustomerAccess = {
  customerId: string;
  userId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
};

export type CustomerAccessResult =
  | { ok: true; access: CustomerAccess }
  | { ok: false; response: NextResponse };

// Customer-portal's own equivalent of the dashboard's requireDomainAccess()
// - same authenticate -> look up profile -> build client shape, but keyed
// on customerId (bookings_customer_access RLS/current_customer_id()),
// never tenantId. A customer profile is deliberately never tenant-scoped
// (see the Product-5 identity migration), so there is no "no_tenant_context"
// case here - the equivalent failure is "no_customer_context": an
// authenticated customer-role user who was never invited (or whose invite
// hasn't linked a customer_id yet) has a real session but nothing to show.
export async function requireCustomerAccess(): Promise<CustomerAccessResult> {
  const result = await requireRole(["customer"]);

  if (!result.authorized) {
    // Stabilization Phase 1: requireRole()'s "error" reason (the profile
    // query itself failed) must not be reported as a 403 - that would
    // tell the client "you don't have permission" when the real problem
    // is a server-side fault. Mapped to 500 instead; the failure itself
    // was already logged with full detail at its source in
    // requireRole() (never here - this stays a plain status/tag, no DB
    // internals reach the response body).
    const status = result.reason === "unauthenticated" ? 401 : result.reason === "error" ? 500 : 403;
    return {
      ok: false,
      response: NextResponse.json({ error: result.reason }, { status }),
    };
  }

  if (!result.profile.customerId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "no_customer_context" }, { status: 403 }),
    };
  }

  const supabase = await createServerSupabaseClient();

  return {
    ok: true,
    access: {
      customerId: result.profile.customerId,
      userId: result.profile.id,
      supabase,
    },
  };
}
