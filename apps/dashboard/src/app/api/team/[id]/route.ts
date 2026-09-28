import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { teamMembersService } from "@travio/api";
import { requireAgencyOwnerAccess } from "@/lib/auth/require-domain-access";
import { updateTeamMemberRoleSchema } from "../_lib/schemas";

const ROUTE = "/api/team/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Delegates the actual authorization (caller is agency_owner, target is
// same-tenant, new_role is one of the four assignable roles) to
// update_team_member_role() - this route only validates the request
// shape and surfaces the RPC's own rejection as a 400 rather than
// letting a raw Postgres exception leak through handleApiError's
// generic 500.
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAgencyOwnerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateTeamMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const member = await teamMembersService.updateRole(auth.access.supabase, id, parsed.data.role);
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && /agency owner|assignable roles|not a member/i.test(error.message)) {
      return NextResponse.json({ error: "invalid_input", message: error.message }, { status: 400 });
    }
    return handleApiError(error, {
      route: ROUTE,
      action: "PATCH",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }
}
