import { NextResponse } from "next/server";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import { isAgencyInactive } from "./agency-active";
import type { UserRole } from "@travio/types";
import {
  CUSTOMERS_ROLES,
  LEADS_ROLES,
  BOOKINGS_ROLES,
  VISA_ROLES,
  FINANCE_ROLES,
  DOCUMENTS_ROLES,
  ANALYTICS_ROLES,
  NOTIFICATION_ROLES,
  AGENCY_OWNER_ROLES,
} from "./domain-roles";

export type DomainAccess = {
  tenantId: string;
  userId: string;
  role: UserRole;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
};

export type DomainAccessResult =
  | { ok: true; access: DomainAccess }
  | { ok: false; response: NextResponse };

// Phase 4D: replaces the single, shared requireCrmAccess() gate every
// dashboard API route used to call. That one gate blocked visa_officer/
// accountant from ever reaching any route, since neither role was in its
// fixed 4-role list. Every requireXAccess() below is this exact same
// authenticate -> look up profile/tenant -> build client flow, just with
// a different allowed-role list per domain - no auth logic is duplicated,
// only the role list differs.
async function requireDomainAccess(
  allowedRoles: readonly UserRole[],
): Promise<DomainAccessResult> {
  const result = await requireRole([...allowedRoles]);

  if (!result.authorized) {
    // Stabilization Phase 1: requireRole()'s "error" reason (the profile
    // query itself failed) must not be reported as a 403 - that would
    // tell the client "you don't have permission" when the real problem
    // is a server-side fault. Mapped to 500 instead; the failure itself
    // was already logged with full detail at its source in
    // requireRole() (never here - this stays a plain status/tag, no DB
    // internals reach the response body).
    const status = result.reason === "unauthenticated" ? 401 : result.reason === "error" ? 500 : 403;
    return {
      ok: false,
      response: NextResponse.json({ error: result.reason }, { status }),
    };
  }

  if (!result.profile.tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "no_tenant_context" }, { status: 403 }),
    };
  }

  const supabase = await createServerSupabaseClient();

  // RLS already blocks a deactivated agency, but /api/team and the portal
  // invite use the service-role client, so it's refused here for every route.
  if (await isAgencyInactive(supabase, result.profile.tenantId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "agency_inactive" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    access: {
      tenantId: result.profile.tenantId,
      userId: result.profile.id,
      role: result.profile.role,
      supabase,
    },
  };
}

// Role lists live in ./domain-roles.ts (shared with the sidebar).

export function requireCustomersAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(CUSTOMERS_ROLES);
}

export function requireLeadsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(LEADS_ROLES);
}

export function requireBookingsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(BOOKINGS_ROLES);
}

export function requireVisaAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(VISA_ROLES);
}

export function requireFinanceAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(FINANCE_ROLES);
}

export function requireDocumentsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(DOCUMENTS_ROLES);
}

export function requireAnalyticsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(ANALYTICS_ROLES);
}

export function requireNotificationAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(NOTIFICATION_ROLES);
}

export function requireAgencyOwnerAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(AGENCY_OWNER_ROLES);
}
