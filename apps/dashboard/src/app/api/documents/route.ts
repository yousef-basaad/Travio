import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-api-error";
import {
  documentService,
  customerService,
  bookingsService,
  invoiceService,
} from "@travio/api";
import { ownerTypeSchema, type OwnerType } from "@travio/types";
import { requireDocumentsAccess } from "@/lib/auth/require-domain-access";
import { createDocumentSchema } from "./_lib/schemas";

const ROUTE = "/api/documents";

// Query params are a read filter, not a mutation - still validated
// against the shared ownerTypeSchema rather than passed through
// as-is, same discipline as every other route in this app.
export async function GET(request: Request) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const ownerTypeParam = url.searchParams.get("ownerType");
  const ownerIdParam = url.searchParams.get("ownerId");

  let ownerType: OwnerType | undefined;
  if (ownerTypeParam) {
    const parsed = ownerTypeSchema.safeParse(ownerTypeParam);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_owner_type" }, { status: 400 });
    }
    ownerType = parsed.data;
  }

  try {
    const documents = await documentService.list(auth.access.supabase, {
      ownerType,
      ownerId: ownerIdParam ?? undefined,
    });
    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

export async function POST(request: Request) {
  const auth = await requireDocumentsAccess();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // The client uploads directly to Storage before calling this route -
  // the object path must already be prefixed with the caller's own
  // tenant_id (Storage RLS enforces this at upload time too), so a
  // filePath pointing anywhere else is rejected here rather than
  // trusted as-is.
  if (!parsed.data.filePath.startsWith(`${auth.access.tenantId}/`)) {
    return NextResponse.json({ error: "invalid_file_path" }, { status: 400 });
  }

  try {
    // ownerId is never trusted as-is - resolved through the caller's own
    // RLS-scoped client so an owner belonging to another tenant is
    // indistinguishable from a nonexistent one, same convention as
    // POST /api/invoices' customerId/bookingId checks.
    if (parsed.data.ownerId) {
      const exists = await ownerExists(
        auth.access.supabase,
        parsed.data.ownerType,
        parsed.data.ownerId,
      );
      if (!exists) {
        return NextResponse.json({ error: "invalid_owner" }, { status: 400 });
      }
    }

    const document = await documentService.create(auth.access.supabase, {
      ...parsed.data,
      tenantId: auth.access.tenantId,
      uploadedBy: auth.access.userId,
    });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "POST", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}

async function ownerExists(
  supabase: Parameters<typeof customerService.getById>[0],
  ownerType: OwnerType,
  ownerId: string,
): Promise<boolean> {
  switch (ownerType) {
    case "customer":
      return Boolean(await customerService.getById(supabase, ownerId));
    case "booking":
      return Boolean(await bookingsService.getById(supabase, ownerId));
    case "invoice":
      return Boolean(await invoiceService.getById(supabase, ownerId));
    case "agency":
      return true;
  }
}
