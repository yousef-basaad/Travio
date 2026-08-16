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
    const status = result.reason === "unauthenticated" ? 401 : 403;
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
