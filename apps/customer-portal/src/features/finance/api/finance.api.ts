"use client";

import { useQuery } from "@tanstack/react-query";
import type { Invoice, Payment } from "@travio/api";

export const INVOICES_QUERY_KEY = ["invoices"];

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

// Reuses invoiceService.listByCustomer (via GET /api/invoices), scoped
// by invoices_customer_access RLS - same shape as useBookings/
// useDocuments, never sends or accepts a customerId here.
export function useInvoices() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: fetchInvoices,
  });
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

// Payments have no safe tenant-wide-style list of their own for a
// customer (payments carries no customer_id, only invoice_id) - the
// safe scoped path is per-invoice, reusing paymentService.listByInvoice
// exactly as the dashboard's own invoice detail view does. Only fetched
// once an invoice row is expanded (enabled), not for every invoice up
// front.
export function useInvoicePayments(invoiceId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId, "payments"],
    queryFn: () => fetchInvoicePayments(invoiceId),
    enabled: enabled && Boolean(invoiceId),
  });
}
