import { z } from "zod";

// Single source of truth for document classification - shared by UI
// (select options), API validation (zod schemas), and packages/api
// (DocumentType/OwnerType TS types). Kept in sync with the
// documents_document_type_check/documents_owner_type_check CHECK
// constraints in supabase/migrations/*_documents.sql - the database
// constraint is still the enforced source of truth; this is the one
// place the app-layer list is spelled out, and changing either side
// requires updating the other.
export const DOCUMENT_TYPES = [
  "passport",
  "visa",
  "national_id",
  "flight_ticket",
  "hotel_voucher",
  "insurance",
  "invoice_pdf",
  "receipt",
  "booking_attachment",
  "customer_attachment",
  "agency_document",
] as const;

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Who a document belongs to. "agency" means tenant-level with no
// specific owner (owner_id is null in that case).
export const OWNER_TYPES = ["customer", "booking", "invoice", "agency"] as const;

export const ownerTypeSchema = z.enum(OWNER_TYPES);
export type OwnerType = z.infer<typeof ownerTypeSchema>;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: "Passport",
  visa: "Visa",
  national_id: "National ID",
  flight_ticket: "Flight Ticket",
  hotel_voucher: "Hotel Voucher",
  insurance: "Insurance",
  invoice_pdf: "Invoice PDF",
  receipt: "Receipt",
  booking_attachment: "Booking Attachment",
  customer_attachment: "Customer Attachment",
  agency_document: "Agency Document",
};
