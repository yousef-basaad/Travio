"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeOverview } from "@travio/api";
import { BOOKINGS_QUERY_KEY } from "@/features/bookings";

// Under the bookings key, so changing a booking refreshes the home page.
export function useHomeOverview() {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEY, "home-overview"],
    queryFn: async (): Promise<HomeOverview> => {
      const response = await fetch("/api/home-overview");
      if (!response.ok) throw new Error(`Failed to load the home page (${response.status})`);
      return (await response.json()) as HomeOverview;
    },
  });
}
