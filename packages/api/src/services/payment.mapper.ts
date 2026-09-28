import type { Database } from "@travio/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsertRow = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdateRow = Database["public"]["Tables"]["payments"]["Update"];

// method is a real Postgres enum (payment_method: cash/card/bank_transfer/
// online) - same as InvoiceStatus/VisaStatus, the generated Row type
// already gives an exact literal union, no runtime guard needed.
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface CreatePaymentInput {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  paidAt?: string | null;
}

export interface UpdatePaymentInput {
  amount?: number;
  method?: PaymentMethod;
  reference?: string | null;
  paidAt?: string | null;
}

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceId: row.invoice_id,
    amount: row.amount,
    method: row.method,
    reference: row.reference,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

export function toPaymentInsert(input: CreatePaymentInput): PaymentInsertRow {
  return {
    tenant_id: input.tenantId,
    invoice_id: input.invoiceId,
    amount: input.amount,
    method: input.method,
    reference: input.reference ?? null,
    paid_at: input.paidAt,
  };
}

export function toPaymentUpdate(input: UpdatePaymentInput): PaymentUpdateRow {
  return {
    amount: input.amount,
    method: input.method,
    reference: input.reference,
    paid_at: input.paidAt,
  };
}
