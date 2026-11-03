import type { UserRole } from "@travio/types";

// Which roles may use each dashboard domain. Plain data with no server
// imports, so it's shared by the API route guards (require-domain-access.ts)
// and the client-side navigation (dashboard-sidebar.tsx): the sidebar shows
// exactly what the API will allow. RLS enforces the same lists in Postgres
// (20261026120000_authorization_alignment.sql).

// Every role allowed into the dashboard app at all ((dashboard)/layout.tsx).
export const DASHBOARD_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
] as const satisfies readonly UserRole[];

// Customers domain (customers/**, including the read-only invoices/
// timeline tabs nested under a customer) - unchanged from the old
// requireCrmAccess() role list.
export const CUSTOMERS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;

// Leads domain (crm/leads/**, crm/notes/**, crm/activities/**) -
// unchanged from the old requireCrmAccess() role list.
export const LEADS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;

// Bookings domain (bookings/**, flights/**, hotels/**, transfers/**,
// including the read-only invoices/timeline tabs nested under a booking) -
// unchanged from the old requireCrmAccess() role list.
export const BOOKINGS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;

// Visa domain (visa-applications/**, customers/[id]/visas) - gives
// visa_officer the dedicated route access Phase 4C.2's ownership model
// needs. sales_agent is allowed too (Phase 2 authorization alignment):
// RLS limits it to visas of customers it can see, so its Customer 360
// visa tab works instead of returning 403.
export const VISA_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "visa_officer",
  "sales_agent",
] as const;

// Finance domain (invoices/**, invoice-items/**, payments/**, expenses/**) -
// accountant's dedicated, exclusive workspace. Deliberately narrower than
// the old blanket CRM gate: sales_agent and branch_manager no longer
// reach finance-record management directly (they retain read-only
// visibility of invoices via the Customers/Bookings domain routes above).
export const FINANCE_ROLES = ["travio_admin", "agency_owner", "accountant"] as const;

// Documents domain (documents/**) - a document's owner_type can be a
// booking, customer, or visa application, so every role that can work
// any of those domains (plus accountant, for finance-related documents)
// needs access here.
export const DOCUMENTS_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
] as const;

// Analytics domain (analytics/**) - previously excluded sales_agent even
// though the dashboard layout gate itself let sales_agent reach the
// /analytics page, so the page rendered but every /api/analytics/* call
// 401'd for that role. Corrected to match: sales_agent is a normal
// dashboard-eligible staff role with the same tenant-wide analytics need
// as branch_manager (both work bookings/customers day-to-day). visa_officer
// and accountant remain restricted - each has its own domain-specific
// view instead of tenant-wide analytics.
export const ANALYTICS_ROLES = ["travio_admin", "agency_owner", "branch_manager", "sales_agent"] as const;

// Notifications domain (notifications/**) - a personal inbox, not a
// domain-restricted resource (notifications.user_id/RLS already scope
// every read/write to the caller themselves - see
// notifications_select_own/_update_own). Every role that can reach the
// dashboard at all gets access, so visa_officer/accountant (newly
// dashboard-eligible as of this phase) can see their own notifications
// too, same as every other staff role already could.
export const NOTIFICATION_ROLES = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
  "visa_officer",
  "accountant",
] as const;

// Agency domain (team/**, tenant/**, subscription/**) - Product-4's
// Agency Growth Foundation. Deliberately narrower than every other
// gate above: team roster/invites, the agency profile, and subscription
// status are all owner-level concerns per this phase's own framing
// ("Agency owner should be able to..."), not something every staff role
// needs day-to-day. update_team_member_role() and the tenants UPDATE RLS
// policy both re-check agency_owner server-side too (defense-in-depth,
// same convention as every other privileged RPC in this codebase) - this
// gate is the first line, not the only one.
export const AGENCY_OWNER_ROLES = ["travio_admin", "agency_owner"] as const;
