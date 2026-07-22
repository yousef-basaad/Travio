"use client";

import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@travio/api";

// CUSTOMERS_QUERY_KEY must stay exactly ["customers"] - leads.api.ts's
// useConvertLead() already invalidates this same key (a prefix-match
// invalidateQueries({ queryKey: ["customers"] }) call after a lead
// converts) so a mounted customers list picks up the newly created/
// linked customer without a manual refresh.
export const CUSTOMERS_QUERY_KEY = ["customers"];

// Unlike the previous version of this file, this never touches Supabase
// directly - it goes through the REST endpoint, matching leads.api.ts's
// pattern. The route resolves the caller's tenant server-side and
// enforces auth/roles (see app/api/customers), so no tenantId is needed
// here.
async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch("/api/customers");

  if (!response.ok) {
    throw new Error(`Failed to load customers (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/customers");
  }

  return data as Customer[];
}

export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: fetchCustomers,
  });
}
