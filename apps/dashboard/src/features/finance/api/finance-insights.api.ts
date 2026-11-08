"use client";

import { useQuery } from "@tanstack/react-query";
import type { FinanceInsights } from "@travio/api";
import { EXPENSES_QUERY_KEY } from "./expenses.api";

// Under the expenses key, so adding an expense (which invalidates
// EXPENSES_QUERY_KEY) refreshes the charts too. Invoice/payment changes
// show on the next visit or window focus, like the dashboard stats.
export const FINANCE_INSIGHTS_QUERY_KEY = [...EXPENSES_QUERY_KEY, "insights"];

async function fetchFinanceInsights(): Promise<FinanceInsights> {
  const response = await fetch("/api/finance/insights");
  if (!response.ok) {
    throw new Error(`Failed to load finance insights (${response.status})`);
  }
  return (await response.json()) as FinanceInsights;
}

export function useFinanceInsights() {
  return useQuery({ queryKey: FINANCE_INSIGHTS_QUERY_KEY, queryFn: fetchFinanceInsights });
}
