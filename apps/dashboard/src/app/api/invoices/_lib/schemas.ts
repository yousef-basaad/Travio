import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// Matches the real invoice_status enum exactly.
const invoiceStatusSchema = z.enum(["draft", "issued", "paid", "partially_paid", "cancelled"]);

// tenantId is intentionally absent - resolved from the authenticated
// session, never trusted from the request body. Unlike the nested
// booking-services routes (flights/hotels/transfers), POST /api/invoices
// is flat - customerId/bookingId aren't derivable from a URL param here,
// so they're accepted in the body and independently re-validated
// (resolved through the caller's own RLS-scoped client) in the route
// handler before use, same "never trust as-is" reasoning as
// createBookingSchema's customerId.
export const createInvoiceSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  status: z.preprocess(emptyToUndefined, invoiceStatusSchema.optional()),
  // The invoice total is entered manually for now (no invoice_items
  // until v1.2.0) - the one required amount this iteration.
  total: z.number().nonnegative(),
  currency: z.preprocess(emptyToUndefined, z.string().optional()),
  issueDate: z.preprocess(emptyToUndefined, z.string().date().optional()),
  dueDate: z.preprocess(emptyToUndefined, z.string().date().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a nullable field must send an explicit null, same
// reasoning as updateBookingSchema/updateCustomerSchema. total/status/
// invoiceNumber/currency stay non-nullable-but-optional (no "unset"),
// matching updateBookingSchema's totalAmount/status.
export const updateInvoiceSchema = z.object({
  customerId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  bookingId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required").optional(),
  status: z.preprocess(emptyToUndefined, invoiceStatusSchema.optional()),
  total: z.number().nonnegative().optional(),
  currency: z.preprocess(emptyToUndefined, z.string().optional()),
  issueDate: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  dueDate: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

// Matches invoice_items_item_type_check exactly.
const invoiceItemTypeSchema = z.enum(["flight", "hotel", "transfer", "visa", "manual"]);

// invoiceId/tenantId are intentionally absent - invoiceId comes from the
// URL param and tenantId from the authenticated session, never trusted
// from the request body. referenceId isn't cross-validated against its
// target table (it's polymorphic across four different service tables
// depending on itemType, and purely informational - see the migration's
// own reasoning for why no FK backs it either).
export const createInvoiceItemSchema = z.object({
  itemType: z.preprocess(emptyToUndefined, invoiceItemTypeSchema.optional()),
  referenceId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().nonnegative().optional(),
  // Computed client-side as quantity * unitPrice (see
  // create-invoice-item-dialog.tsx) and sent explicitly, same reasoning
  // as createInvoiceSchema's total.
  total: z.number().nonnegative(),
});

// Unlike create, update submits the full current state of every editable
// field - clearing referenceId sends an explicit null, same reasoning as
// updateInvoiceSchema. itemType/description/quantity/unitPrice/total
// stay non-nullable-but-optional (no "unset").
export const updateInvoiceItemSchema = z.object({
  itemType: z.preprocess(emptyToUndefined, invoiceItemTypeSchema.optional()),
  referenceId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  description: z.string().trim().min(1, "Description is required").optional(),
  quantity: z.number().int().min(1).optional(),
  unitPrice: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
});

// Matches the real payment_method enum exactly.
const paymentMethodSchema = z.enum(["cash", "card", "bank_transfer", "online"]);

// invoiceId/tenantId are intentionally absent - invoiceId comes from the
// URL param and tenantId from the authenticated session, never trusted
// from the request body. amount is positive (not just nonnegative,
// unlike invoice/item totals) - a payment recording 0 money received
// isn't a meaningful ledger entry.
export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  method: paymentMethodSchema,
  reference: z.preprocess(emptyToUndefined, z.string().optional()),
  // Date-only input, matching issueDate/dueDate's UI convention - paid_at
  // is timestamptz at the DB level but the app has no time-of-day picker
  // anywhere else, so precision beyond the day isn't asked for here.
  paidAt: z.preprocess(emptyToUndefined, z.string().date().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing reference/paidAt sends an explicit null, same
// reasoning as updateInvoiceSchema. amount/method stay
// non-nullable-but-optional (no "unset").
export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: paymentMethodSchema.optional(),
  reference: z.preprocess(emptyToNull, z.string().nullable().optional()),
  paidAt: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
});
