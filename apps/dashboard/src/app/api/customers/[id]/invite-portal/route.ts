import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService } from "@travio/api";
import { createAdminSupabaseClient } from "@travio/database/admin";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/customers/:id/invite-portal";

type RouteParams = { params: Promise<{ id: string }> };

// Real Supabase Auth invite (sends the actual invite email) - mirrors
// /api/team's POST handler exactly, retargeted at customers. customer_id/
// role are stamped into the invited user's metadata here, server-side,
// never accepted from a request body (there is none - the customer's own
// email/name are read from their existing customers row, never
// re-entered). handle_new_user() (Product-5's migration) only honors
// that metadata when new.invited_at is set - a column only this admin
// API ever sets - which is what stops a public self-signup from forging
// a customer_id to read someone else's data. profiles.customer_id is
// also unique at the database level, so re-inviting an already-linked
// customer fails loudly (a unique_violation surfaces as a 400 below)
// rather than silently creating a second portal identity for the same
// record.
export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomersAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // RLS makes a customer in another tenant look identical to a
    // nonexistent one, same convention as customers/[id]/route.ts.
    const customer = await customerService.getById(auth.access.supabase, id);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!customer.email) {
      return NextResponse.json(
        { error: "invalid_input", message: "This customer has no email on file." },
        { status: 400 },
      );
    }

    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(customer.email, {
      data: {
        customer_id: customer.id,
        role: "customer",
        full_name: customer.fullName,
      },
    });

    if (error) {
      return NextResponse.json({ error: "invite_failed", message: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "invite_failed" }, { status: 500 });
    }

    return NextResponse.json({ id: data.user.id, email: customer.email }, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "POST",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}
