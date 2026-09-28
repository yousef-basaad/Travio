import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { customerService, invoiceService } from "@travio/api";
import { requireCustomersAccess } from "@/lib/auth/require-domain-access";

const ROUTE = "/api/customers/:id/invoices";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap - CRM-wide, not
// invoices-specific, same as customers/[id]/timeline/route.ts.
export async function GET(_request: Request, { params }: RouteParams) {
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

    const invoices = await invoiceService.listByCustomer(auth.access.supabase, id);
    return NextResponse.json(invoices);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
