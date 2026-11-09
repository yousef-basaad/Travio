"use client";

import { useQuery } from "@tanstack/react-query";
import type { VisaCenterStats } from "@travio/api";

// Under the visa applications key, so the visa mutations' existing
// invalidation (["visa-applications"]) refreshes these numbers too.
export const VISA_CENTER_STATS_QUERY_KEY = ["visa-applications", "center-stats"];

async function fetchVisaCenterStats(): Promise<VisaCenterStats> {
  const response = await fetch("/api/visa-applications/stats");
  if (!response.ok) {
    throw new Error(`Failed to load visa center stats (${response.status})`);
  }
  return (await response.json()) as VisaCenterStats;
}

export function useVisaCenterStats() {
  return useQuery({ queryKey: VISA_CENTER_STATS_QUERY_KEY, queryFn: fetchVisaCenterStats });
}
