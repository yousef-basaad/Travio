import type { DocumentType, OwnerType } from "@travio/types";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Message keys for document and owner types (translated display of the
// values from @travio/types).
export const DOCUMENT_TYPE_KEYS: Record<DocumentType, MessageKey> = {
  passport: "documentType.passport",
  visa: "documentType.visa",
  national_id: "documentType.national_id",
  flight_ticket: "documentType.flight_ticket",
  hotel_voucher: "documentType.hotel_voucher",
  insurance: "documentType.insurance",
  invoice_pdf: "documentType.invoice_pdf",
  receipt: "documentType.receipt",
  booking_attachment: "documentType.booking_attachment",
  customer_attachment: "documentType.customer_attachment",
  agency_document: "documentType.agency_document",
};

export const OWNER_TYPE_KEYS: Record<OwnerType, MessageKey> = {
  customer: "ownerType.customer",
  booking: "ownerType.booking",
  invoice: "ownerType.invoice",
  agency: "ownerType.agency",
};
