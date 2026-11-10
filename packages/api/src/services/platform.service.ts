import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";

export interface PlatformPeriod {
  agencies: number;
  customers: number;
  bookings: number;
  revenue: number;
  collected: number;
}

export interface PlatformDay {
  /** "YYYY-MM-DD" (UTC) */
  day: string;
  revenue: number;
  bookings: number;
}

export interface PlatformAgency {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  /** Plan slug, or null without a live subscription. */
  plan: string | null;
  customers: number;
  bookings: number;
  revenue: number;
}

export type PlatformActivityKind = "agency_created" | "booking_created" | "payment_received";

export interface PlatformActivity {
  kind: PlatformActivityKind;
  agency: string;
  amount: number | null;
  at: string;
}

export interface PlatformOverview {
  agencies: number;
  activeAgencies: number;
  users: number;
  customers: number;
  bookings: number;
  revenue: number;
  collected: number;
  thisMonth: PlatformPeriod;
  lastMonth: PlatformPeriod;
  /** The last 30 days, oldest first. */
  daily: PlatformDay[];
  /** Agencies per plan slug; "none" for agencies without a live subscription. */
  byPlan: { plan: string; agencies: number }[];
  bookingsByStatus: Record<string, number>;
  recentAgencies: PlatformAgency[];
  activity: PlatformActivity[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const ACTIVITY_KINDS: readonly PlatformActivityKind[] = ["agency_created", "booking_created", "payment_received"];

function toPeriod(value: unknown): PlatformPeriod {
  const raw = asRecord(value);
  return {
    agencies: num(raw.agencies),
    customers: num(raw.customers),
    bookings: num(raw.bookings),
    revenue: num(raw.revenue),
    collected: num(raw.collected),
  };
}

// Maps platform_overview's jsonb (20261108140000); anything missing or
// malformed reads as zero / empty.
export function toPlatformOverview(data: unknown): PlatformOverview {
  const raw = asRecord(data);
  const byStatus = asRecord(raw.bookings_by_status);
  return {
    agencies: num(raw.agencies),
    activeAgencies: num(raw.active_agencies),
    users: num(raw.users),
    customers: num(raw.customers),
    bookings: num(raw.bookings),
    revenue: num(raw.revenue),
    collected: num(raw.collected),
    thisMonth: toPeriod(raw.this_month),
    lastMonth: toPeriod(raw.last_month),
    daily: asList(raw.daily).map((row) => ({ day: text(row.day), revenue: num(row.revenue), bookings: num(row.bookings) })),
    byPlan: asList(raw.by_plan).map((row) => ({ plan: text(row.plan), agencies: num(row.agencies) })),
    bookingsByStatus: Object.fromEntries(Object.entries(byStatus).map(([status, count]) => [status, num(count)])),
    recentAgencies: asList(raw.recent_agencies).map((row) => ({
      id: text(row.id),
      name: text(row.name),
      isActive: row.is_active === true,
      createdAt: text(row.created_at),
      plan: typeof row.plan === "string" ? row.plan : null,
      customers: num(row.customers),
      bookings: num(row.bookings),
      revenue: num(row.revenue),
    })),
    activity: asList(raw.activity)
      .filter((row) => (ACTIVITY_KINDS as readonly string[]).includes(text(row.kind)))
      .map((row) => ({
        kind: text(row.kind) as PlatformActivityKind,
        agency: text(row.agency),
        amount: row.amount === null || row.amount === undefined ? null : num(row.amount),
        at: text(row.at),
      })),
  };
}

export type AgencyStatusFilter = "all" | "active" | "inactive";

export interface AgencyListItem {
  id: string;
  name: string;
  slug: string;
  crNumber: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  /** Plan slug, or null without a live subscription. */
  plan: string | null;
  subscriptionStatus: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  staff: number;
  customers: number;
  bookings: number;
  revenue: number;
}

export interface AgencyListPage {
  total: number;
  items: AgencyListItem[];
}

export interface AgencyListQuery {
  search?: string;
  status?: AgencyStatusFilter;
  page?: number;
  pageSize?: number;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

// Maps platform_agencies' jsonb (20261109120000).
export function toAgencyListPage(data: unknown): AgencyListPage {
  const raw = asRecord(data);
  return {
    total: num(raw.total),
    items: asList(raw.items).map((row) => ({
      id: text(row.id),
      name: text(row.name),
      slug: text(row.slug),
      crNumber: textOrNull(row.cr_number),
      email: textOrNull(row.email),
      phone: textOrNull(row.phone),
      isActive: row.is_active === true,
      createdAt: text(row.created_at),
      plan: textOrNull(row.plan),
      subscriptionStatus: textOrNull(row.subscription_status),
      ownerName: textOrNull(row.owner_name),
      ownerEmail: textOrNull(row.owner_email),
      staff: num(row.staff),
      customers: num(row.customers),
      bookings: num(row.bookings),
      revenue: num(row.revenue),
    })),
  };
}

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  agencyId: string | null;
  agencyName: string | null;
  /** Null for accounts without an agency. */
  agencyActive: boolean | null;
  createdAt: string;
  /** Null when the account has never signed in. */
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

export interface PlatformUserPage {
  total: number;
  items: PlatformUser[];
}

export interface PlatformUserQuery {
  search?: string;
  /** A user_role value, or "all". */
  role?: string;
  page?: number;
  pageSize?: number;
}

// Maps platform_users' jsonb (20261109130000).
export function toPlatformUserPage(data: unknown): PlatformUserPage {
  const raw = asRecord(data);
  return {
    total: num(raw.total),
    items: asList(raw.items).map((row) => ({
      id: text(row.id),
      fullName: text(row.full_name),
      email: text(row.email),
      role: text(row.role),
      agencyId: textOrNull(row.agency_id),
      agencyName: textOrNull(row.agency_name),
      agencyActive: typeof row.agency_active === "boolean" ? row.agency_active : null,
      createdAt: text(row.created_at),
      lastSignInAt: textOrNull(row.last_sign_in_at),
      emailConfirmed: row.email_confirmed === true,
    })),
  };
}

export interface PlatformSubscription {
  /** The agency's id. */
  id: string;
  name: string;
  isActive: boolean;
  /** Plan slug; null for an agency that has never had a subscription. */
  plan: string | null;
  status: string | null;
  price: number | null;
  billingInterval: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface PlatformSubscriptionSummary {
  /** Active subscriptions at list price, per month. Not money collected. */
  expectedMrr: number;
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  expired: number;
  none: number;
}

export interface PlatformSubscriptionPage {
  total: number;
  summary: PlatformSubscriptionSummary;
  items: PlatformSubscription[];
}

export interface PlatformSubscriptionQuery {
  search?: string;
  /** A subscription status, "none", or "all". */
  status?: string;
  page?: number;
  pageSize?: number;
}

// Maps platform_subscriptions' jsonb (20261109140000).
export function toPlatformSubscriptionPage(data: unknown): PlatformSubscriptionPage {
  const raw = asRecord(data);
  const summary = asRecord(raw.summary);
  return {
    total: num(raw.total),
    summary: {
      expectedMrr: num(summary.expected_mrr),
      active: num(summary.active),
      trialing: num(summary.trialing),
      pastDue: num(summary.past_due),
      cancelled: num(summary.cancelled),
      expired: num(summary.expired),
      none: num(summary.none),
    },
    items: asList(raw.items).map((row) => ({
      id: text(row.id),
      name: text(row.name),
      isActive: row.is_active === true,
      plan: textOrNull(row.plan),
      status: textOrNull(row.status),
      price: row.price === null || row.price === undefined ? null : num(row.price),
      billingInterval: textOrNull(row.billing_interval),
      startsAt: textOrNull(row.starts_at),
      endsAt: textOrNull(row.ends_at),
    })),
  };
}

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingInterval: string;
  isActive: boolean;
  /** feature_key to value: a whole number as text, or "unlimited". */
  limits: Record<string, string>;
  /** Agencies with a live subscription on this plan. */
  agencies: number;
}

// Maps platform_plans' jsonb (20261109150000).
export function toPlatformPlans(data: unknown): PlatformPlan[] {
  return asList(data).map((row) => ({
    id: text(row.id),
    name: text(row.name),
    slug: text(row.slug),
    price: num(row.price),
    billingInterval: text(row.billing_interval),
    isActive: row.is_active === true,
    limits: Object.fromEntries(
      Object.entries(asRecord(row.limits)).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
    agencies: num(row.agencies),
  }));
}

export interface PlatformAuditDetails {
  price: number;
  limits: Record<string, string>;
}

export interface PlatformAuditEntry {
  id: number;
  actorEmail: string | null;
  action: "agency_deactivated" | "agency_activated" | "plan_updated";
  targetLabel: string;
  before: PlatformAuditDetails | null;
  after: PlatformAuditDetails | null;
  createdAt: string;
}

export interface PlatformAuditPage {
  total: number;
  items: PlatformAuditEntry[];
}

function toAuditDetails(value: unknown): PlatformAuditDetails | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = asRecord(value);
  return {
    price: num(raw.price),
    limits: Object.fromEntries(Object.entries(asRecord(raw.limits)).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
  };
}

// Maps platform_audit_entries' jsonb (20261110170000).
export function toPlatformAuditPage(data: unknown): PlatformAuditPage {
  const raw = asRecord(data);
  return {
    total: num(raw.total),
    items: asList(raw.items).map((row) => {
      const details = asRecord(row.details);
      return {
        id: num(row.id),
        actorEmail: textOrNull(row.actor_email),
        action: text(row.action) as PlatformAuditEntry["action"],
        targetLabel: text(row.target_label),
        before: toAuditDetails(details.before),
        after: toAuditDetails(details.after),
        createdAt: text(row.created_at),
      };
    }),
  };
}

// The Super Admin console. Every platform_* function refuses anyone who
// isn't travio_admin, so these are safe with the signed-in user's client.
export const platformService = {
  async listAudit(supabase: SupabaseClient<Database>, page: number, pageSize: number): Promise<PlatformAuditPage> {
    const { data, error } = await supabase.rpc("platform_audit_entries", { page_number: page, page_size: pageSize });
    if (error) throw error;
    return toPlatformAuditPage(data);
  },

  async listPlans(supabase: SupabaseClient<Database>): Promise<PlatformPlan[]> {
    const { data, error } = await supabase.rpc("platform_plans");
    if (error) throw error;
    return toPlatformPlans(data);
  },

  async updatePlan(supabase: SupabaseClient<Database>, planId: string, price: number, limits: Record<string, string>): Promise<void> {
    const { error } = await supabase.rpc("platform_update_plan", { target_plan: planId, new_price: price, new_limits: limits });
    if (error) throw error;
  },

  async listSubscriptions(supabase: SupabaseClient<Database>, query: PlatformSubscriptionQuery = {}): Promise<PlatformSubscriptionPage> {
    const { data, error } = await supabase.rpc("platform_subscriptions", {
      search_text: query.search ?? "",
      status_filter: query.status ?? "all",
      page_number: query.page ?? 1,
      page_size: query.pageSize ?? 20,
    });
    if (error) throw error;
    return toPlatformSubscriptionPage(data);
  },

  async listUsers(supabase: SupabaseClient<Database>, query: PlatformUserQuery = {}): Promise<PlatformUserPage> {
    const { data, error } = await supabase.rpc("platform_users", {
      search_text: query.search ?? "",
      role_filter: query.role ?? "all",
      page_number: query.page ?? 1,
      page_size: query.pageSize ?? 20,
    });
    if (error) throw error;
    return toPlatformUserPage(data);
  },

  async listAgencies(supabase: SupabaseClient<Database>, query: AgencyListQuery = {}): Promise<AgencyListPage> {
    const { data, error } = await supabase.rpc("platform_agencies", {
      search_text: query.search ?? "",
      status_filter: query.status ?? "all",
      page_number: query.page ?? 1,
      page_size: query.pageSize ?? 20,
    });
    if (error) throw error;
    return toAgencyListPage(data);
  },

  async setAgencyActive(supabase: SupabaseClient<Database>, tenantId: string, active: boolean): Promise<void> {
    const { error } = await supabase.rpc("platform_set_agency_active", { target_tenant: tenantId, active });
    if (error) throw error;
  },

  async getOverview(supabase: SupabaseClient<Database>): Promise<PlatformOverview> {
    const { data, error } = await supabase.rpc("platform_overview");
    if (error) throw error;
    return toPlatformOverview(data);
  },
};
