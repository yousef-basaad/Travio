"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer, CustomerTimelineItem, VisaApplication, VisaStatus } from "@travio/api";
import type { Booking } from "@/features/bookings";

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

// Mirrors POST /api/customers' createCustomerSchema (app/api/customers/
// _lib/schemas.ts). tenantId never comes from here - the route takes it
// from the session. assignedTo is left out, same as the New Lead dialog.
export interface CreateCustomerInput {
  fullName: string;
  phone?: string;
  email?: string;
  /** "YYYY-MM-DD" - what <input type="date"> yields and the API expects. */
  passportExpiry?: string;
  preferredLanguage?: string;
}

export type CreateCustomerField = keyof CreateCustomerInput;
export type CreateCustomerFieldErrors = Partial<Record<CreateCustomerField, string>>;

const CREATE_CUSTOMER_FIELDS: readonly CreateCustomerField[] = [
  "fullName",
  "phone",
  "email",
  "passportExpiry",
  "preferredLanguage",
];

const CREATE_CUSTOMER_GENERIC_ERROR = "Couldn't create the customer. Please try again.";

// Thrown for the API's 400 so the dialog can put each message next to
// its own field; anything it can't pin to a field lands in formError.
export class CreateCustomerValidationError extends Error {
  constructor(
    public readonly fieldErrors: CreateCustomerFieldErrors,
    public readonly formError: string | null,
  ) {
    super("Customer details are invalid");
    this.name = "CreateCustomerValidationError";
  }
}

function isCreateCustomerField(value: unknown): value is CreateCustomerField {
  return typeof value === "string" && (CREATE_CUSTOMER_FIELDS as readonly string[]).includes(value);
}

// Maps a 400 body ({ error: "invalid_input", issues: ZodIssue[] }) to
// per-field messages (first message per field wins). Issues for fields
// this form doesn't show, or a body with no usable issues (e.g. the
// route's invalid-JSON 400), become a single general message.
export function toCreateCustomerErrors(body: unknown): {
  fieldErrors: CreateCustomerFieldErrors;
  formError: string | null;
} {
  const fieldErrors: CreateCustomerFieldErrors = {};
  let hasUnmappedIssue = false;

  const issues =
    body && typeof body === "object" && "issues" in body && Array.isArray(body.issues)
      ? (body.issues as unknown[])
      : [];

  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const field = "path" in issue && Array.isArray(issue.path) ? issue.path[0] : undefined;
    const message = "message" in issue && typeof issue.message === "string" ? issue.message : null;
    if (isCreateCustomerField(field) && message) {
      fieldErrors[field] ??= message;
    } else {
      hasUnmappedIssue = true;
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  return {
    fieldErrors,
    formError: hasUnmappedIssue || !hasFieldErrors ? CREATE_CUSTOMER_GENERIC_ERROR : null,
  };
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.status === 400) {
    const body: unknown = await response.json().catch(() => null);
    const { fieldErrors, formError } = toCreateCustomerErrors(body);
    throw new CreateCustomerValidationError(fieldErrors, formError);
  }

  if (!response.ok) {
    throw new Error(`Failed to create customer (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/customers");
  }

  return data as Customer;
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
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

// Product-5: sends a real Supabase Auth invite email to this customer,
// linking their existing customers row to a new portal identity - no
// email/name is collected here, both come from the customer's own
// already-loaded record server-side (see the route). Nothing to
// invalidate on success - this doesn't change any field on the Customer
// resource itself, only creates an auth/profiles row elsewhere.
async function inviteCustomerToPortal(customerId: string): Promise<{ id: string; email: string }> {
  const response = await fetch(`/api/customers/${customerId}/invite-portal`, {
    method: "POST",
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Failed to invite customer (${response.status})`;
    throw new Error(message);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/customers/:id/invite-portal");
  }

  return data as { id: string; email: string };
}

export function useInviteCustomerToPortal() {
  return useMutation({
    mutationFn: inviteCustomerToPortal,
  });
}

function customerTimelineQueryKey(customerId: string) {
  return [...CUSTOMERS_QUERY_KEY, customerId, "timeline"];
}

// Read-only - customerTimelineService composes customer/crm_leads
// server-side and returns them pre-sorted (newest first), matching
// useLeadTimeline's reasoning exactly.
async function fetchCustomerTimeline(customerId: string): Promise<CustomerTimelineItem[]> {
  const response = await fetch(`/api/customers/${customerId}/timeline`);

  if (!response.ok) {
    throw new Error(`Failed to load timeline (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/customers/:id/timeline");
  }

  return data as CustomerTimelineItem[];
}

export function useCustomerTimeline(customerId: string) {
  return useQuery({
    queryKey: customerTimelineQueryKey(customerId),
    queryFn: () => fetchCustomerTimeline(customerId),
    enabled: Boolean(customerId),
  });
}

function customerBookingsQueryKey(customerId: string) {
  return [...CUSTOMERS_QUERY_KEY, customerId, "bookings"];
}

// No customer-scoped bookings endpoint exists (and this issue's scope is
// apps/dashboard only, no new API routes) - reuses the existing
// GET /api/bookings and filters by customerId client-side, same reasoning
// as bookings-table.tsx's client-side customer-name lookup.
async function fetchCustomerBookings(customerId: string): Promise<Booking[]> {
  const response = await fetch("/api/bookings");

  if (!response.ok) {
    throw new Error(`Failed to load bookings (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings");
  }

  return (data as Booking[]).filter((booking) => booking.customerId === customerId);
}

export function useCustomerBookings(customerId: string) {
  return useQuery({
    queryKey: customerBookingsQueryKey(customerId),
    queryFn: () => fetchCustomerBookings(customerId),
    enabled: Boolean(customerId),
  });
}

function customerVisasQueryKey(customerId: string) {
  return [...CUSTOMERS_QUERY_KEY, customerId, "visas"];
}

async function fetchCustomerVisas(customerId: string): Promise<VisaApplication[]> {
  const response = await fetch(`/api/customers/${customerId}/visas`);

  if (!response.ok) {
    throw new Error(`Failed to load visa applications (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/customers/:id/visas");
  }

  return data as VisaApplication[];
}

export function useCustomerVisas(customerId: string) {
  return useQuery({
    queryKey: customerVisasQueryKey(customerId),
    queryFn: () => fetchCustomerVisas(customerId),
    enabled: Boolean(customerId),
  });
}

// Booking-scoped counterpart to useCustomerVisas - mirrors
// invoices.api.ts's customerInvoicesQueryKey/bookingInvoicesQueryKey
// pairing (same file, own query key per scope). Read-only from Booking
// 360 (see VisaList's own comment) - visas are still only ever created/
// edited/deleted from the Customer 360 tab, so there's no
// useCreateBookingVisa/useDeleteBookingVisa here.
function bookingVisasQueryKey(bookingId: string) {
  return [...CUSTOMERS_QUERY_KEY, "booking", bookingId, "visas"];
}

async function fetchBookingVisas(bookingId: string): Promise<VisaApplication[]> {
  const response = await fetch(`/api/bookings/${bookingId}/visas`);

  if (!response.ok) {
    throw new Error(`Failed to load visa applications (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/visas");
  }

  return data as VisaApplication[];
}

export function useBookingVisas(bookingId: string) {
  return useQuery({
    queryKey: bookingVisasQueryKey(bookingId),
    queryFn: () => fetchBookingVisas(bookingId),
    enabled: Boolean(bookingId),
  });
}

async function createVisa({
  customerId,
  bookingId,
  country,
  visaType,
  status,
  submittedAt,
}: {
  customerId: string;
  bookingId?: string | null;
  country?: string;
  visaType?: string;
  status?: VisaStatus;
  submittedAt?: string;
}): Promise<VisaApplication> {
  const response = await fetch(`/api/customers/${customerId}/visas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, country, visaType, status, submittedAt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create visa application (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/customers/:id/visas");
  }

  return data as VisaApplication;
}

export function useCreateVisa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVisa,
    onSuccess: (_visa, variables) => {
      void queryClient.invalidateQueries({
        queryKey: customerVisasQueryKey(variables.customerId),
      });
      // Also invalidate the booking-scoped view when this visa was
      // linked to one, so Booking 360's read-only visa list (if mounted)
      // picks up the newly created row too.
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingVisasQueryKey(variables.bookingId),
        });
      }
    },
  });
}

async function updateVisa({
  id,
  bookingId,
  assignedTo,
  country,
  visaType,
  status,
  submittedAt,
}: {
  id: string;
  customerId: string;
  bookingId?: string | null;
  assignedTo?: string | null;
  country?: string | null;
  visaType?: string | null;
  status?: VisaStatus;
  submittedAt?: string | null;
}): Promise<VisaApplication> {
  const response = await fetch(`/api/visa-applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId, assignedTo, country, visaType, status, submittedAt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update visa application (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/visa-applications/:id");
  }

  return data as VisaApplication;
}

export function useUpdateVisa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVisa,
    onSuccess: (_visa, variables) => {
      void queryClient.invalidateQueries({
        queryKey: customerVisasQueryKey(variables.customerId),
      });
      // Same reasoning as useCreateVisa - only invalidates the new
      // bookingId (if the visa was relinked away from a previous
      // booking, that booking's cached view goes stale until its own
      // next mount/refetch, same as any other not-actively-watched
      // query in this app).
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingVisasQueryKey(variables.bookingId),
        });
      }
    },
  });
}

async function deleteVisa({ id }: { id: string; customerId: string }): Promise<void> {
  const response = await fetch(`/api/visa-applications/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete visa application (${response.status})`);
  }
}

export function useDeleteVisa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVisa,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: customerVisasQueryKey(variables.customerId),
      });
    },
  });
}
