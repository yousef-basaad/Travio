"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  InvoiceItemType,
  Payment,
  PaymentMethod,
} from "@travio/api";

// Stable top-level key other invoice mutations invalidate by prefix,
// matching CUSTOMERS_QUERY_KEY/BOOKINGS_QUERY_KEY's convention. Invoices
// are listed two ways (by customer, by booking), so each gets its own
// suffixed key rather than a single shared list key.
export const INVOICES_QUERY_KEY = ["invoices"];

function customerInvoicesQueryKey(customerId: string) {
  return [...INVOICES_QUERY_KEY, "customer", customerId];
}

function bookingInvoicesQueryKey(bookingId: string) {
  return [...INVOICES_QUERY_KEY, "booking", bookingId];
}

function invoiceQueryKey(id: string) {
  return [...INVOICES_QUERY_KEY, id];
}

async function fetchCustomerInvoices(customerId: string): Promise<Invoice[]> {
  const response = await fetch(`/api/customers/${customerId}/invoices`);

  if (!response.ok) {
    throw new Error(`Failed to load invoices (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/customers/:id/invoices");
  }

  return data as Invoice[];
}

export function useCustomerInvoices(customerId: string) {
  return useQuery({
    queryKey: customerInvoicesQueryKey(customerId),
    queryFn: () => fetchCustomerInvoices(customerId),
    enabled: Boolean(customerId),
  });
}

// Tenant-wide - no customer/booking scoping, used by the Finance
// workspace's InvoiceTable. Same INVOICES_QUERY_KEY prefix as the
// customer/booking-scoped variants, suffixed "all" to keep its own cache
// entry distinct from customerInvoicesQueryKey/bookingInvoicesQueryKey.
function allInvoicesQueryKey() {
  return [...INVOICES_QUERY_KEY, "all"];
}

async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch("/api/invoices");

  if (!response.ok) {
    throw new Error(`Failed to load invoices (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/invoices");
  }

  return data as Invoice[];
}

export function useInvoices() {
  return useQuery({
    queryKey: allInvoicesQueryKey(),
    queryFn: fetchInvoices,
  });
}

async function fetchBookingInvoices(bookingId: string): Promise<Invoice[]> {
  const response = await fetch(`/api/bookings/${bookingId}/invoices`);

  if (!response.ok) {
    throw new Error(`Failed to load invoices (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/invoices");
  }

  return data as Invoice[];
}

export function useBookingInvoices(bookingId: string) {
  return useQuery({
    queryKey: bookingInvoicesQueryKey(bookingId),
    queryFn: () => fetchBookingInvoices(bookingId),
    enabled: Boolean(bookingId),
  });
}

// Distinguished from a generic fetch failure so a future details view can
// show "Invoice not found" instead of a generic error message, matching
// CustomerNotFoundError/LeadNotFoundError/BookingNotFoundError's pattern.
export class InvoiceNotFoundError extends Error {
  constructor() {
    super("Invoice not found");
    this.name = "InvoiceNotFoundError";
  }
}

async function fetchInvoice(id: string): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${id}`);

  if (response.status === 404) {
    throw new InvoiceNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Failed to load invoice (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices/:id");
  }

  return data as Invoice;
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceQueryKey(id),
    queryFn: () => fetchInvoice(id),
    enabled: Boolean(id),
    // A 404 won't become found by retrying, matching useCustomer's reasoning.
    retry: false,
  });
}

// customerId/bookingId here are only ever used to invalidate the right
// list query below - POST /api/invoices is a flat endpoint (unlike the
// nested booking-services routes), so both are sent in the request body,
// not derived from a URL param.
async function createInvoice({
  customerId,
  bookingId,
  invoiceNumber,
  status,
  total,
  currency,
  issueDate,
  dueDate,
  notes,
}: {
  customerId?: string | null;
  bookingId?: string | null;
  invoiceNumber: string;
  status?: InvoiceStatus;
  total: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}): Promise<Invoice> {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId,
      bookingId,
      invoiceNumber,
      status,
      total,
      currency,
      issueDate,
      dueDate,
      notes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create invoice (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices");
  }

  return data as Invoice;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (_invoice, variables) => {
      if (variables.customerId) {
        void queryClient.invalidateQueries({
          queryKey: customerInvoicesQueryKey(variables.customerId),
        });
      }
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingInvoicesQueryKey(variables.bookingId),
        });
      }
    },
  });
}

async function updateInvoice({
  id,
  invoiceNumber,
  status,
  total,
  currency,
  issueDate,
  dueDate,
  notes,
}: {
  id: string;
  // Only used for cache invalidation below - not sent to the server.
  customerId?: string | null;
  bookingId?: string | null;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  total?: number;
  currency?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceNumber, status, total, currency, issueDate, dueDate, notes }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update invoice (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices/:id");
  }

  return data as Invoice;
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: (updatedInvoice, variables) => {
      queryClient.setQueryData(invoiceQueryKey(updatedInvoice.id), updatedInvoice);
      if (variables.customerId) {
        void queryClient.invalidateQueries({
          queryKey: customerInvoicesQueryKey(variables.customerId),
        });
      }
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingInvoicesQueryKey(variables.bookingId),
        });
      }
    },
  });
}

async function deleteInvoice({ id }: { id: string; customerId?: string | null; bookingId?: string | null }): Promise<void> {
  const response = await fetch(`/api/invoices/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete invoice (${response.status})`);
  }
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: (_data, variables) => {
      if (variables.customerId) {
        void queryClient.invalidateQueries({
          queryKey: customerInvoicesQueryKey(variables.customerId),
        });
      }
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingInvoicesQueryKey(variables.bookingId),
        });
      }
    },
  });
}

async function restoreInvoice({
  id,
}: {
  id: string;
  customerId?: string | null;
  bookingId?: string | null;
}): Promise<Invoice> {
  const response = await fetch(`/api/invoices/${id}/restore`, { method: "POST" });

  if (!response.ok) {
    throw new Error(`Failed to restore invoice (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices/:id/restore");
  }

  return data as Invoice;
}

export function useRestoreInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreInvoice,
    onSuccess: (_invoice, variables) => {
      if (variables.customerId) {
        void queryClient.invalidateQueries({
          queryKey: customerInvoicesQueryKey(variables.customerId),
        });
      }
      if (variables.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingInvoicesQueryKey(variables.bookingId),
        });
      }
    },
  });
}

function invoiceItemsQueryKey(invoiceId: string) {
  return [...INVOICES_QUERY_KEY, invoiceId, "items"];
}

async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const response = await fetch(`/api/invoices/${invoiceId}/items`);

  if (!response.ok) {
    throw new Error(`Failed to load invoice items (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/invoices/:id/items");
  }

  return data as InvoiceItem[];
}

export function useInvoiceItems(invoiceId: string) {
  return useQuery({
    queryKey: invoiceItemsQueryKey(invoiceId),
    queryFn: () => fetchInvoiceItems(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

async function createInvoiceItem({
  invoiceId,
  itemType,
  referenceId,
  description,
  quantity,
  unitPrice,
  total,
}: {
  invoiceId: string;
  itemType?: InvoiceItemType;
  referenceId?: string | null;
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}): Promise<InvoiceItem> {
  const response = await fetch(`/api/invoices/${invoiceId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemType, referenceId, description, quantity, unitPrice, total }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create invoice item (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices/:id/items");
  }

  return data as InvoiceItem;
}

export function useCreateInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoiceItem,
    onSuccess: (_item, variables) => {
      void queryClient.invalidateQueries({
        queryKey: invoiceItemsQueryKey(variables.invoiceId),
      });
    },
  });
}

async function updateInvoiceItem({
  id,
  itemType,
  referenceId,
  description,
  quantity,
  unitPrice,
  total,
}: {
  id: string;
  invoiceId: string;
  itemType?: InvoiceItemType;
  referenceId?: string | null;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}): Promise<InvoiceItem> {
  const response = await fetch(`/api/invoice-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemType, referenceId, description, quantity, unitPrice, total }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update invoice item (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoice-items/:id");
  }

  return data as InvoiceItem;
}

export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoiceItem,
    onSuccess: (_item, variables) => {
      void queryClient.invalidateQueries({
        queryKey: invoiceItemsQueryKey(variables.invoiceId),
      });
    },
  });
}

async function deleteInvoiceItem({ id }: { id: string; invoiceId: string }): Promise<void> {
  const response = await fetch(`/api/invoice-items/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete invoice item (${response.status})`);
  }
}

export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoiceItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: invoiceItemsQueryKey(variables.invoiceId),
      });
    },
  });
}

function paymentsQueryKey(invoiceId: string) {
  return [...INVOICES_QUERY_KEY, invoiceId, "payments"];
}

async function fetchInvoicePayments(invoiceId: string): Promise<Payment[]> {
  const response = await fetch(`/api/invoices/${invoiceId}/payments`);

  if (!response.ok) {
    throw new Error(`Failed to load payments (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/invoices/:id/payments");
  }

  return data as Payment[];
}

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: paymentsQueryKey(invoiceId),
    queryFn: () => fetchInvoicePayments(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

// Booking-scoped counterpart to useInvoicePayments - mirrors
// bookingInvoicesQueryKey's shape, backed by the new
// GET /api/bookings/:id/payments route (paymentService.listByBooking).
// Read-only: payments are still only ever recorded against a specific
// invoice (CreatePaymentDialog, launched from PaymentsList), so there's
// no useCreateBookingPayment here.
function bookingPaymentsQueryKey(bookingId: string) {
  return [...INVOICES_QUERY_KEY, "booking", bookingId, "payments"];
}

async function fetchBookingPayments(bookingId: string): Promise<Payment[]> {
  const response = await fetch(`/api/bookings/${bookingId}/payments`);

  if (!response.ok) {
    throw new Error(`Failed to load payments (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/payments");
  }

  return data as Payment[];
}

export function useBookingPayments(bookingId: string) {
  return useQuery({
    queryKey: bookingPaymentsQueryKey(bookingId),
    queryFn: () => fetchBookingPayments(bookingId),
    enabled: Boolean(bookingId),
  });
}

// Tenant-wide - a separate top-level key (not nested under
// INVOICES_QUERY_KEY, unlike per-invoice payments) since this isn't
// scoped to any single invoice. Used by the Finance workspace's
// PaymentStatus.
export const PAYMENTS_QUERY_KEY = ["payments"];

async function fetchPayments(): Promise<Payment[]> {
  const response = await fetch("/api/payments");

  if (!response.ok) {
    throw new Error(`Failed to load payments (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/payments");
  }

  return data as Payment[];
}

export function usePayments() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: fetchPayments,
  });
}

async function createPayment({
  invoiceId,
  amount,
  method,
  reference,
  paidAt,
}: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt?: string;
}): Promise<Payment> {
  const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, method, reference, paidAt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create payment (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/invoices/:id/payments");
  }

  return data as Payment;
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (_payment, variables) => {
      void queryClient.invalidateQueries({
        queryKey: paymentsQueryKey(variables.invoiceId),
      });
    },
  });
}

async function updatePayment({
  id,
  amount,
  method,
  reference,
  paidAt,
}: {
  id: string;
  invoiceId: string;
  amount?: number;
  method?: PaymentMethod;
  reference?: string | null;
  paidAt?: string | null;
}): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, method, reference, paidAt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update payment (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/payments/:id");
  }

  return data as Payment;
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePayment,
    onSuccess: (_payment, variables) => {
      void queryClient.invalidateQueries({
        queryKey: paymentsQueryKey(variables.invoiceId),
      });
    },
  });
}

async function deletePayment({ id }: { id: string; invoiceId: string }): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete payment (${response.status})`);
  }
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePayment,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: paymentsQueryKey(variables.invoiceId),
      });
    },
  });
}
