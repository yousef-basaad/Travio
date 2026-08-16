import { NextResponse } from "next/server";
import { customerService } from "@travio/api";
import { requireCustomerAccess } from "@/lib/auth/require-customer-access";
import { handleApiError } from "@/lib/api/handle-api-error";

const ROUTE = "/api/profile";

// Always resolves to the caller's own linked customer record - no :id
// param, same "my own X" reasoning as the dashboard's notifications
// routes. customers_customer_access RLS (Product-5 migration) is the
// real boundary; customerService.getById is the exact same service
// bookings/documents/invoices already reuse, called here with the id
// requireCustomerAccess resolved from the caller's own profile, never
// from a client-supplied value.
export async function GET() {
  const auth = await requireCustomerAccess();
  if (!auth.ok) return auth.response;

  try {
    const customer = await customerService.getById(auth.access.supabase, auth.access.customerId);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", customerId: auth.access.customerId, userId: auth.access.userId });
  }
}
