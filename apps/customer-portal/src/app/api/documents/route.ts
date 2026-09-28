import { NextResponse } from "next/server";
import { documentService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/documents";

// No ownerType/ownerId filter is passed - documentService.list() with no
// filter returns every row RLS lets this session see, and
// documents_customer_access (Product-6 migration) is what actually
// scopes that to this customer's own documents (owned directly, via
// their bookings, or via their invoices). Never accepts a customer id
// from the client; current_customer_id() inside the policy is the only
// source of truth for "whose documents."
export async function GET() {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  try {
    const documents = await documentService.list(auth.access.supabase);
    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
