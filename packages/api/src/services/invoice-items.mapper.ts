import type { Database } from "@travio/database";

type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];
type InvoiceItemInsertRow = Database["public"]["Tables"]["invoice_items"]["Insert"];
type InvoiceItemUpdateRow = Database["public"]["Tables"]["invoice_items"]["Update"];

// item_type is plain text + a CHECK constraint
// (invoice_items_item_type_check), not a Postgres enum - same reasoning
// as CabinClass/BoardType/TransferType. Not nullable (defaults to
// 'manual'), so the runtime guard only needs to reject unexpected
// values, never handle null.
const INVOICE_ITEM_TYPES = ["flight", "hotel", "transfer", "visa", "manual"] as const;

export type InvoiceItemType = (typeof INVOICE_ITEM_TYPES)[number];

function isInvoiceItemType(value: string): value is InvoiceItemType {
  return (INVOICE_ITEM_TYPES as readonly string[]).includes(value);
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  itemType: InvoiceItemType;
  // Polymorphic - points at a row in booking_flights/booking_hotels/
  // booking_transfers/visa_applications depending on itemType, or stays
  // null for a manual line item. No FK backs this (see the migration
  // comment); purely informational.
  referenceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string | null;
}

export interface CreateInvoiceItemInput {
  tenantId: string;
  invoiceId: string;
  itemType?: InvoiceItemType;
  referenceId?: string | null;
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface UpdateInvoiceItemInput {
  itemType?: InvoiceItemType;
  referenceId?: string | null;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export function toInvoiceItem(row: InvoiceItemRow): InvoiceItem {
  if (!isInvoiceItemType(row.item_type)) {
    // Should be unreachable given invoice_items_item_type_check, but the
    // DB column is untyped text - fail loudly rather than silently
    // lying about the type to callers.
    throw new Error(`Unexpected invoice_items.item_type value: ${row.item_type}`);
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    invoiceId: row.invoice_id,
    itemType: row.item_type,
    referenceId: row.reference_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
    createdAt: row.created_at,
  };
}

export function toInvoiceItemInsert(input: CreateInvoiceItemInput): InvoiceItemInsertRow {
  return {
    tenant_id: input.tenantId,
    invoice_id: input.invoiceId,
    item_type: input.itemType,
    reference_id: input.referenceId ?? null,
    description: input.description,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    total: input.total,
  };
}

export function toInvoiceItemUpdate(input: UpdateInvoiceItemInput): InvoiceItemUpdateRow {
  return {
    item_type: input.itemType,
    reference_id: input.referenceId,
    description: input.description,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    total: input.total,
  };
}
