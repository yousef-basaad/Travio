"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CrmLead } from "@travio/api";
import type { CreateLeadFormValues } from "../schemas/create-lead.schema";
import type { EditLeadFormValues } from "../schemas/edit-lead.schema";

const LEADS_QUERY_KEY = ["crm-leads"];

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
    queryKey: LEADS_QUERY_KEY,
    queryFn: fetchLeads,
  });
}

async function createLead(input: CreateLeadFormValues): Promise<CrmLead> {
  const response = await fetch("/api/crm/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create lead (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/leads");
  }

  return data as CrmLead;
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}

// Distinguished from a generic fetch failure so the details page can show
// "Lead not found" instead of a generic error message.
export class LeadNotFoundError extends Error {
  constructor() {
    super("Lead not found");
    this.name = "LeadNotFoundError";
  }
}

async function fetchLead(id: string): Promise<CrmLead> {
  const response = await fetch(`/api/crm/leads/${id}`);

  if (response.status === 404) {
    throw new LeadNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Failed to load lead (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/leads/:id");
  }

  return data as CrmLead;
}

export function useLead(id: string) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, id],
    queryFn: () => fetchLead(id),
    enabled: Boolean(id),
    // A 404 won't become found by retrying, and every other error is
    // already rare for a same-origin, first-party API - fail fast.
    retry: false,
  });
}

async function updateLead({
  id,
  input,
}: {
  id: string;
  input: EditLeadFormValues;
}): Promise<CrmLead> {
  const response = await fetch(`/api/crm/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to update lead (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/leads/:id");
  }

  return data as CrmLead;
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLead,
    onSuccess: (updatedLead) => {
      // Seed the detail query directly with the authoritative server
      // response so the details page shows updated values immediately,
      // without waiting on a refetch. The list query is invalidated
      // (exact match only - the detail query above is already fresh).
      queryClient.setQueryData([...LEADS_QUERY_KEY, updatedLead.id], updatedLead);
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY, exact: true });
    },
  });
}
