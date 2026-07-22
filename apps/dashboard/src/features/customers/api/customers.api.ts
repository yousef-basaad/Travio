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

// Distinguished from a generic fetch failure so the details page can show
// "Customer not found" instead of a generic error message - matches
// leads.api.ts's LeadNotFoundError pattern.
export class CustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found");
    this.name = "CustomerNotFoundError";
  }
}

async function fetchCustomer(id: string): Promise<Customer> {
  const response = await fetch(`/api/customers/${id}`);

  if (response.status === 404) {
    throw new CustomerNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Failed to load customer (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/customers/:id");
  }

  return data as Customer;
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, id],
    queryFn: () => fetchCustomer(id),
    enabled: Boolean(id),
    // A 404 won't become found by retrying, matching useLead's reasoning.
    retry: false,
  });
}
