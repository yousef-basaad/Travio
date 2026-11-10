import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireDocumentsAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/documents/quota";
const bodySchema = z.object({ fileSize: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER) });

// Asked before a file goes to storage, so a document the plan won't allow
// doesn't leave an orphaned file behind. The database trigger on
// documents is what actually enforces the limit.
export async function POST(request: Request) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const { data, error } = await auth.access.supabase.rpc("check_document_quota", { file_bytes: parsed.data.fileSize });
    if (error) throw error;
    if (data) return NextResponse.json({ error: "plan_limit_reached", limit: data }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
