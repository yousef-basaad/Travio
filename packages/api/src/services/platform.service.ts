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

// The Super Admin overview. platform_overview() refuses anyone who isn't
// travio_admin, so this is safe to call with the signed-in user's client.
export const platformService = {
  async getOverview(supabase: SupabaseClient<Database>): Promise<PlatformOverview> {
    const { data, error } = await supabase.rpc("platform_overview");
    if (error) throw error;
    return toPlatformOverview(data);
  },
};
