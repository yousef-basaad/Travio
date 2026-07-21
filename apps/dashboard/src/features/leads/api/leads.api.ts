"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CrmLead, CrmNote, CrmActivity, CrmActivityType } from "@travio/api";
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

export type ConvertLeadResult = {
  outcome: "created" | "linked";
  leadId: string;
  customerId: string;
};

function isConvertLeadResult(value: unknown): value is ConvertLeadResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.outcome === "created" || record.outcome === "linked") &&
    typeof record.leadId === "string" &&
    typeof record.customerId === "string"
  );
}

// Carries the HTTP status through so callers can map it to a friendly
// message (see ConvertLeadDialog) without parsing the error's text.
export class ConvertLeadError extends Error {
  status: number;

  constructor(status: number) {
    super(`Failed to convert lead (${status})`);
    this.name = "ConvertLeadError";
    this.status = status;
  }
}

async function convertLead({
  id,
  forceCreateNew,
}: {
  id: string;
  forceCreateNew?: boolean;
}): Promise<ConvertLeadResult> {
  const response = await fetch(`/api/crm/leads/${id}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forceCreateNew: forceCreateNew ?? false }),
  });

  if (!response.ok) {
    throw new ConvertLeadError(response.status);
  }

  const data: unknown = await response.json();
  if (!isConvertLeadResult(data)) {
    throw new Error("Unexpected response from /api/crm/leads/:id/convert");
  }

  return data;
}

export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: convertLead,
    onSuccess: () => {
      // No full lead object comes back from convert (only ids), so there's
      // nothing to seed directly - invalidate broadly (no `exact`) so both
      // the list and this lead's detail query refetch and pick up the new
      // status/converted_customer_id.
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      // Prefix match (no tenantId known here) - covers useCustomers'
      // ["customers", tenantId] query if one is currently mounted.
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

function leadNotesQueryKey(leadId: string) {
  return [...LEADS_QUERY_KEY, leadId, "notes"];
}

async function fetchLeadNotes(leadId: string): Promise<CrmNote[]> {
  const response = await fetch(`/api/crm/leads/${leadId}/notes`);

  if (!response.ok) {
    throw new Error(`Failed to load notes (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/crm/leads/:id/notes");
  }

  return data as CrmNote[];
}

export function useLeadNotes(leadId: string) {
  return useQuery({
    queryKey: leadNotesQueryKey(leadId),
    queryFn: () => fetchLeadNotes(leadId),
    enabled: Boolean(leadId),
  });
}

async function createLeadNote({
  leadId,
  body,
}: {
  leadId: string;
  body: string;
}): Promise<CrmNote> {
  const response = await fetch(`/api/crm/leads/${leadId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create note (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/leads/:id/notes");
  }

  return data as CrmNote;
}

export function useCreateLeadNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeadNote,
    onSuccess: (_note, variables) => {
      void queryClient.invalidateQueries({ queryKey: leadNotesQueryKey(variables.leadId) });
    },
  });
}

async function deleteLeadNote({ id }: { id: string; leadId: string }): Promise<void> {
  const response = await fetch(`/api/crm/notes/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete note (${response.status})`);
  }
}

export function useDeleteLeadNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeadNote,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: leadNotesQueryKey(variables.leadId) });
    },
  });
}

function leadActivitiesQueryKey(leadId: string) {
  return [...LEADS_QUERY_KEY, leadId, "activities"];
}

async function fetchLeadActivities(leadId: string): Promise<CrmActivity[]> {
  const response = await fetch(`/api/crm/leads/${leadId}/activities`);

  if (!response.ok) {
    throw new Error(`Failed to load activities (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/crm/leads/:id/activities");
  }

  return data as CrmActivity[];
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: leadActivitiesQueryKey(leadId),
    queryFn: () => fetchLeadActivities(leadId),
    enabled: Boolean(leadId),
  });
}

async function createLeadActivity({
  leadId,
  type,
  title,
  description,
}: {
  leadId: string;
  type: CrmActivityType;
  title: string;
  description?: string | null;
}): Promise<CrmActivity> {
  const response = await fetch(`/api/crm/leads/${leadId}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, title, description }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create activity (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/leads/:id/activities");
  }

  return data as CrmActivity;
}

export function useCreateLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeadActivity,
    onSuccess: (_activity, variables) => {
      void queryClient.invalidateQueries({ queryKey: leadActivitiesQueryKey(variables.leadId) });
    },
  });
}

async function updateLeadActivity({
  id,
  type,
  title,
  description,
}: {
  id: string;
  leadId: string;
  type?: CrmActivityType;
  title?: string;
  description?: string | null;
}): Promise<CrmActivity> {
  const response = await fetch(`/api/crm/activities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, title, description }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update activity (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/crm/activities/:id");
  }

  return data as CrmActivity;
}

export function useUpdateLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLeadActivity,
    onSuccess: (_activity, variables) => {
      void queryClient.invalidateQueries({ queryKey: leadActivitiesQueryKey(variables.leadId) });
    },
  });
}

async function deleteLeadActivity({ id }: { id: string; leadId: string }): Promise<void> {
  const response = await fetch(`/api/crm/activities/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete activity (${response.status})`);
  }
}

export function useDeleteLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeadActivity,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: leadActivitiesQueryKey(variables.leadId) });
    },
  });
}
