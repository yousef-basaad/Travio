"use client";

import { useQuery } from "@tanstack/react-query";
import type { CrmLead } from "@travio/api";

// Unlike bookings/customers, leads never touch Supabase directly from the
// client - they only ever go through the REST endpoint, which resolves the
// caller's tenant server-side and enforces auth/roles (see
// app/api/crm/leads). Ordering (newest first) is applied server-side by
// crmLeadsService.list, not here.
async function fetchLeads(): Promise<CrmLead[]> {
  const response = await fetch("/api/crm/leads");

  if (!response.ok) {
    throw new Error(`Failed to load leads (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/crm/leads");
  }

  return data as CrmLead[];
}

export function useLeads() {
  return useQuery({
    queryKey: ["crm-leads"],
    queryFn: fetchLeads,
  });
}
