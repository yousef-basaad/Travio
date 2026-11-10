import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { BookingStatus } from "@travio/types";
import { lastNMonthKeys, startOfMonth } from "./analytics.service";

/** Months covered by the home page's sparklines. */
export const HOME_TREND_MONTHS = 6;

export interface HomeBoardCard {
  id: string;
  bookingNumber: string;
  title: string;
  startDate: string | null;
  customerName: string | null;
}

export interface HomeBoardColumn {
  status: BookingStatus;
  /** Every booking in this status, not just the cards returned. */
  total: number;
  cards: HomeBoardCard[];
}

export interface HomeScheduleEvent {
  id: string;
  title: string;
  bookingNumber: string;
  kind: "departure" | "return";
}

export interface HomeOverview {
  /** Oldest first, one value per trailing month. */
  bookingsPerMonth: number[];
  customersPerMonth: number[];
  visasPerMonth: number[];
  board: HomeBoardColumn[];
  today: HomeScheduleEvent[];
  /** Profile id to number of assigned bookings. */
  bookingsByMember: Record<string, number>;
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

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function perMonth(value: unknown, months: string[]): number[] {
  const counts = asRecord(value);
  return months.map((month) => num(counts[month]));
}

// Maps home_overview's jsonb (20261110140000).
export function toHomeOverview(data: unknown, months: string[]): HomeOverview {
  const raw = asRecord(data);
  return {
    bookingsPerMonth: perMonth(raw.bookings_by_month, months),
    customersPerMonth: perMonth(raw.customers_by_month, months),
    visasPerMonth: perMonth(raw.visas_by_month, months),
    board: asList(raw.board).map((column) => ({
      status: text(column.status) as BookingStatus,
      total: num(column.total),
      cards: asList(column.items).map((card) => ({
        id: text(card.id),
        bookingNumber: text(card.booking_number),
        title: text(card.title),
        startDate: textOrNull(card.start_date),
        customerName: textOrNull(card.customer_name),
      })),
    })),
    today: asList(raw.today).map((event) => ({
      id: text(event.id),
      title: text(event.title),
      bookingNumber: text(event.booking_number),
      kind: event.kind === "return" ? "return" : "departure",
    })),
    bookingsByMember: Object.fromEntries(Object.entries(asRecord(raw.team)).map(([id, count]) => [id, num(count)])),
  };
}

export const homeOverviewService = {
  // Everything the home page counts, in one query under the caller's RLS.
  async get(supabase: SupabaseClient<Database>): Promise<HomeOverview> {
    const { data, error } = await supabase.rpc("home_overview", { range_start: startOfMonth(HOME_TREND_MONTHS - 1) });
    if (error) throw error;
    return toHomeOverview(data, lastNMonthKeys(HOME_TREND_MONTHS));
  },
};
