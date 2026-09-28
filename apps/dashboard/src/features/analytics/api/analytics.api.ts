"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DashboardStats,
  RevenueOverview,
  BookingAnalytics,
  CustomerAnalytics,
} from "@travio/api";

// Read-only queries only - this module has no mutations, so (unlike
// invoices.api.ts) there's no useQueryClient/invalidation anywhere here.
export const ANALYTICS_QUERY_KEY = ["analytics"];

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${label} (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error(`Unexpected response from ${url}`);
  }

  return data as T;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "dashboard"],
    queryFn: () => fetchJson<DashboardStats>("/api/analytics/dashboard", "dashboard stats"),
  });
}

export function useRevenueOverview() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "revenue"],
    queryFn: () => fetchJson<RevenueOverview>("/api/analytics/revenue", "revenue overview"),
  });
}

export function useBookingAnalytics() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "bookings"],
    queryFn: () => fetchJson<BookingAnalytics>("/api/analytics/bookings", "booking analytics"),
  });
}

export function useCustomerAnalytics() {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "customers"],
    queryFn: () => fetchJson<CustomerAnalytics>("/api/analytics/customers", "customer analytics"),
  });
}
