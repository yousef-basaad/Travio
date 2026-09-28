import { NextResponse } from "next/server";
import { documentService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/documents/:id/signed-url";

type RouteParams = { params: Promise<{ id: string }> };

// Mirrors apps/dashboard's own signed-url route exactly (short-lived,
// never cached, uses the caller's own session-scoped client). Storage's
// own RLS (documents_bucket_customer_select, Product-6 migration) is
// what actually gates this - it re-derives ownership from the
// documents row matching this object's path, so this can't produce a
// URL for another customer's file even if the row lookup below were
// somehow bypassed.
const SIGNED_URL_EXPIRY_SECONDS = 60;

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const document = await documentService.getById(auth.access.supabase, id);
    if (!document) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data, error } = await auth.access.supabase.storage
      .from("documents")
      .createSignedUrl(document.filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data) {
      return handleApiError(error ?? new Error("createSignedUrl returned no data"), {
        route: ROUTE,
        action: "GET",
        customerId: auth.access.customerId,
        userId: auth.access.userId,
      });
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
