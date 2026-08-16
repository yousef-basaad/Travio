import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import { invoiceItemsService } from "@travio/api";
import { requireFinanceAccess } from "@/lib/auth/require-domain-access";
import { updateInvoiceItemSchema } from "../../invoices/_lib/schemas";

const ROUTE = "/api/invoice-items/:id";

type RouteParams = { params: Promise<{ id: string }> };

// Reuses the shared dashboard auth bootstrap and invoices/_lib/schemas.ts -
// both are finance-wide, not items-specific, same as
// flights/[id]/route.ts reusing bookings' own _lib.
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateInvoiceItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const existing = await invoiceItemsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const item = await invoiceItemsService.update(auth.access.supabase, id, parsed.data);
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "PATCH", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireFinanceAccess();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await invoiceItemsService.getById(auth.access.supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await invoiceItemsService.delete(auth.access.supabase, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "DELETE", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
