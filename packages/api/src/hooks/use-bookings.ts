"use client";

import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { bookingsService } from "../services/bookings.service";

// Thin TanStack Query wrapper. Feature code in apps/dashboard imports this
// rather than calling bookingsService directly, keeping caching/loading
// state handling consistent everywhere bookings are listed.
export function useBookings(supabase: SupabaseClient<Database>, tenantId: string) {
  return useQuery({
    queryKey: ["bookings", tenantId],
    queryFn: () => bookingsService.list(supabase, tenantId),
    enabled: Boolean(tenantId),
  });
}
