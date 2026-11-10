import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-api-error";
import { visaApplicationsService } from "@travio/api";
import { requireVisaAccess } from "@/lib/auth/require-domain-access";
import { parsePageRequest } from "@/lib/api/page-request";

const ROUTE = "/api/visa-applications";
const statusSchema = z.enum(["draft", "submitted", "approved", "rejected"]).optional();

// The Visa Center workspace. Which rows come back is decided by RLS
// (managers: all; visa_officer: its own + unassigned; sales_agent: those
// of customers it can see), not by this route. With ?page= it returns one
// page; without it, the full list as before.
export async function GET(request: Request) {
  const auth = await requireVisaAccess();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const pageParse = parsePageRequest(searchParams);
  if (pageParse.kind === "invalid") {
    return NextResponse.json({ error: "invalid_input", issues: pageParse.issues }, { status: 400 });
  }
  const status = statusSchema.safeParse(searchParams.get("status") ?? undefined);
  if (!status.success) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  try {
    if (pageParse.kind === "page") {
      return NextResponse.json(await visaApplicationsService.listPage(auth.access.supabase, { ...pageParse.request, status: status.data }));
    }
    const visas = await visaApplicationsService.listForTenant(auth.access.supabase, auth.access.tenantId);
    return NextResponse.json(visas);
  } catch (error) {
    return handleApiError(error, { route: ROUTE, action: "GET", tenantId: auth.access.tenantId, userId: auth.access.userId });
  }
}
