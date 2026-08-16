import { NextResponse } from "next/server";
import { invoiceService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/invoices";

// Reuses invoiceService.listByCustomer unchanged - same shape as
// /api/bookings reusing bookingsService.listByCustomer (Product-5).
// invoices_customer_access (Product-6 migration) is the real boundary;
// customerId comes from the authenticated session only, never the
// client.
export async function GET() {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  try {
    const invoices = await invoiceService.listByCustomer(auth.access.supabase, auth.access.customerId);
    return NextResponse.json(invoices);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
