import { NextResponse } from "next/server";
import { requireRole } from "@travio/auth/server";
import { createServerSupabaseClient } from "@travio/database/server";
import type { UserRole } from "@travio/types";

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
    const status = result.reason === "unauthenticated" ? 401 : 403;
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

// Customers domain (customers/**, including the read-only invoices/
// timeline tabs nested under a customer) - unchanged from the old
// requireCrmAccess() role list.
const CUSTOMERS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;
export function requireCustomersAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(CUSTOMERS_ROLES);
}

// Leads domain (crm/leads/**, crm/notes/**, crm/activities/**) -
// unchanged from the old requireCrmAccess() role list.
const LEADS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;
export function requireLeadsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(LEADS_ROLES);
}

// Bookings domain (bookings/**, flights/**, hotels/**, transfers/**,
// including the read-only invoices/timeline tabs nested under a booking) -
// unchanged from the old requireCrmAccess() role list.
const BOOKINGS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;
export function requireBookingsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(BOOKINGS_ROLES);
}

// Visa domain (visa-applications/**, customers/[id]/visas) - gives
// visa_officer the dedicated route access Phase 4C.2's ownership model
// needs. Deliberately narrower than the old blanket CRM gate: sales_agent
// no longer reaches visa routes directly (branch_manager still does).
const VISA_ROLES = ["travio_admin", "agency_owner", "branch_manager", "visa_officer"] as const;
export function requireVisaAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(VISA_ROLES);
}

// Finance domain (invoices/**, invoice-items/**, payments/**, expenses/**) -
// accountant's dedicated, exclusive workspace. Deliberately narrower than
// the old blanket CRM gate: sales_agent and branch_manager no longer
// reach finance-record management directly (they retain read-only
// visibility of invoices via the Customers/Bookings domain routes above).
const FINANCE_ROLES = ["travio_admin", "agency_owner", "accountant"] as const;
export function requireFinanceAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(FINANCE_ROLES);
}

// Documents domain (documents/**) - a document's owner_type can be a
// booking, customer, or visa application, so every role that can work
// any of those domains (plus accountant, for finance-related documents)
// needs access here.
const DOCUMENTS_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
] as const;
export function requireDocumentsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(DOCUMENTS_ROLES);
}

// Analytics domain (analytics/**) - previously excluded sales_agent even
// though the dashboard layout gate itself let sales_agent reach the
// /analytics page, so the page rendered but every /api/analytics/* call
// 401'd for that role. Corrected to match: sales_agent is a normal
// dashboard-eligible staff role with the same tenant-wide analytics need
// as branch_manager (both work bookings/customers day-to-day). visa_officer
// and accountant remain restricted - each has its own domain-specific
// view instead of tenant-wide analytics.
const ANALYTICS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;
export function requireAnalyticsAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(ANALYTICS_ROLES);
}

// Notifications domain (notifications/**) - a personal inbox, not a
// domain-restricted resource (notifications.user_id/RLS already scope
// every read/write to the caller themselves - see
// notifications_select_own/_update_own). Every role that can reach the
// dashboard at all gets access, so visa_officer/accountant (newly
// dashboard-eligible as of this phase) can see their own notifications
// too, same as every other staff role already could.
const NOTIFICATION_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
] as const;
export function requireNotificationAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(NOTIFICATION_ROLES);
}

// Agency domain (team/**, tenant/**, subscription/**) - Product-4's
// Agency Growth Foundation. Deliberately narrower than every other
// gate above: team roster/invites, the agency profile, and subscription
// status are all owner-level concerns per this phase's own framing
// ("Agency owner should be able to..."), not something every staff role
// needs day-to-day. update_team_member_role() and the tenants UPDATE RLS
// policy both re-check agency_owner server-side too (defense-in-depth,
// same convention as every other privileged RPC in this codebase) - this
// gate is the first line, not the only one.
const AGENCY_OWNER_ROLES = ["travio_admin", "agency_owner"] as const;
export function requireAgencyOwnerAccess(): Promise<DomainAccessResult> {
  return requireDomainAccess(AGENCY_OWNER_ROLES);
}
