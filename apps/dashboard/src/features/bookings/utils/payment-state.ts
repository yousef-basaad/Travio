import type { InvoiceStatus } from "@travio/api";

export type PaymentState = "none" | "unpaid" | "partial" | "paid";

// How far a booking is paid, from its invoices' statuses (cancelled ones
// ignored): "paid" when every invoice is paid, "partial" when some money
// came in, "unpaid" when none has, "none" without any invoice.
export function paymentState(invoices: { status: InvoiceStatus }[]): PaymentState {
  const active = invoices.filter((invoice) => invoice.status !== "cancelled");
  if (active.length === 0) return "none";
  if (active.every((invoice) => invoice.status === "paid")) return "paid";
  if (active.some((invoice) => invoice.status === "paid" || invoice.status === "partially_paid")) return "partial";
  return "unpaid";
}
