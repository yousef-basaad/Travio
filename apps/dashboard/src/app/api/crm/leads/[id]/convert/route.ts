import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireLeadsAccess } from "@/lib/auth/require-domain-access";
import { convertCrmLeadSchema } from "../../_lib/schemas";

const ROUTE = "/api/crm/leads/:id/convert";

type RouteParams = { params: Promise<{ id: string }> };

type ConvertLeadRpcResult = {
  outcome: "created" | "linked";
  lead_id: string;
  customer_id: string;
};

function isConvertLeadRpcResult(value: unknown): value is ConvertLeadRpcResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.outcome === "created" || record.outcome === "linked") &&
    typeof record.lead_id === "string" &&
    typeof record.customer_id === "string"
  );
}

// SQLSTATEs raised explicitly inside convert_crm_lead
// (supabase/migrations/20260720190617_crm_lead_conversion.sql), mapped to
// the HTTP contract this route promises. All conversion business logic -
// tenant scoping, duplicate detection, the atomic insert-or-link-then-
// update - lives entirely in that function; this route only calls it,
// maps its outcome, and never touches crm_leads/customers directly.
const ERROR_BY_SQLSTATE: Record<string, { status: number; error: string }> = {
  P0002: { status: 404, error: "not_found" },
  "23505": { status: 409, error: "already_converted" },
  "42501": { status: 403, error: "forbidden" },
};

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireLeadsAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // Body is optional (forceCreateNew defaults to false), so an empty POST
  // must not be treated as invalid JSON the way a required-body endpoint
  // would.
  let rawBody: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      rawBody = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = convertCrmLeadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await auth.access.supabase.rpc("convert_crm_lead", {
    lead_id: id,
    force_create_new: parsed.data.forceCreateNew,
  });

  if (error) {
    const mapped = ERROR_BY_SQLSTATE[error.code ?? ""];
    if (mapped) {
      // Expected, handled outcomes (not_found/already_converted/forbidden) -
      // not logged as errors, same as every other route's validation-style
      // 4xx responses.
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    // Never surface the raw database error (message/details/hint) to the
    // client - anything not explicitly recognized is an unexpected failure.
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }

  if (!isConvertLeadRpcResult(data)) {
    return handleApiError(new Error("convert_crm_lead RPC returned an unexpected shape"), {
      route: ROUTE,
      action: "POST",
      tenantId: auth.access.tenantId,
      userId: auth.access.userId,
    });
  }

  return NextResponse.json({
    outcome: data.outcome,
    leadId: data.lead_id,
    customerId: data.customer_id,
  });
}
