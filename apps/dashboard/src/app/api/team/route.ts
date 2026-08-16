import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { teamMembersService } from "@travio/api";
import { createAdminSupabaseClient } from "@travio/database/admin";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { inviteTeamMemberSchema, type TeamMemberResponse } from "./_lib/schemas";

const ROUTE = "/api/team";

// Reuses the shared dashboard auth bootstrap (requireAgencyOwnerAccess),
// same as every other domain route.
export async function GET() {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  try {
    const members = await teamMembersService.listByTenant(
      auth.access.supabase,
      auth.access.tenantId,
    );

    // "Pending" vs "active" comes from Supabase Auth's own tracked state
    // (confirmed_at), not a new status column/table - inviteUserByEmail
    // creates a real auth.users row immediately (unconfirmed, no
    // password yet); the invitee is "active" only once they've followed
    // the invite link and set one. One admin.getUserById() call per
    // member rather than admin.listUsers() - a team is small (single
    // digits to dozens), and this never touches auth users outside this
    // tenant's own profile rows, unlike a project-wide listUsers() scan.
    const adminClient = createAdminSupabaseClient();
    const withStatus: TeamMemberResponse[] = await Promise.all(
      members.map(async (member) => {
        const { data } = await adminClient.auth.admin.getUserById(member.id);
        const status: TeamMemberResponse["status"] =
          data.user?.confirmed_at || data.user?.email_confirmed_at ? "active" : "pending";

        return {
          id: member.id,
          email: member.email,
          fullName: member.fullName,
          role: member.role,
          status,
          createdAt: member.createdAt,
        };
      }),
    );

    return NextResponse.json(withStatus);
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "GET",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}

export async function POST(request: Request) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = inviteTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // Real Supabase Auth invite (sends the actual invite email) - tenant_id/
    // role are stamped into the invited user's metadata here, server-side,
    // never accepted from the invitee themselves. handle_new_user() (see
    // this phase's migration) reads them back out, but only honors them
    // when new.invited_at is set - a column only this admin API ever sets,
    // which is what stops a public self-signup from forging the same
    // metadata to grant itself a role/tenant.
    const adminClient = createAdminSupabaseClient();
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: {
        tenant_id: auth.access.tenantId,
        role: parsed.data.role,
        full_name: parsed.data.fullName,
      },
    });

    if (error) {
      return NextResponse.json({ error: "invite_failed", message: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "invite_failed" }, { status: 500 });
    }

    const response: TeamMemberResponse = {
      id: data.user.id,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      status: "pending",
      createdAt: data.user.created_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      route: ROUTE,
      action: "POST",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}
