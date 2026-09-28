import type { Database } from "@travio/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsertRow = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdateRow = Database["public"]["Tables"]["invoices"]["Update"];

// status is a real Postgres enum (invoice_status: draft/issued/paid/
// partially_paid/cancelled) - same as VisaStatus, the generated Row type
// already gives an exact literal union, no runtime guard needed.
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string | null;
  bookingId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  // subtotal/tax stay at their DB default (0) for now - invoice_items
  // (v1.2.0) will be what actually computes them. total is the only
  // manually-entered amount this iteration.
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  issueDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateInvoiceInput {
  tenantId: string;
  customerId?: string | null;
  bookingId?: string | null;
  invoiceNumber: string;
  status?: InvoiceStatus;
  total: number;
  currency?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface UpdateInvoiceInput {
  customerId?: string | null;
  bookingId?: string | null;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  total?: number;
  currency?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    bookingId: row.booking_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function toInvoiceInsert(input: CreateInvoiceInput): InvoiceInsertRow {
  return {
    tenant_id: input.tenantId,
    customer_id: input.customerId ?? null,
    booking_id: input.bookingId ?? null,
    invoice_number: input.invoiceNumber,
    status: input.status,
    total: input.total,
    currency: input.currency,
    issue_date: input.issueDate,
    due_date: input.dueDate,
    notes: input.notes ?? null,
  };
}

export function toInvoiceUpdate(input: UpdateInvoiceInput): InvoiceUpdateRow {
  return {
    customer_id: input.customerId,
    booking_id: input.bookingId,
    invoice_number: input.invoiceNumber,
    status: input.status,
    total: input.total,
    currency: input.currency,
    issue_date: input.issueDate,
    due_date: input.dueDate,
    notes: input.notes,
  };
}
