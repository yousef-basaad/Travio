import { z } from "zod";

// Single source of truth for notification classification - same
// pattern as DOCUMENT_TYPES (packages/types/src/schemas/document.ts):
// shared by packages/api (runtime validation in the mapper) and the UI,
// kept in sync with the notifications_type_check CHECK constraint in
// supabase/migrations/*_notifications.sql. The database constraint is
// still the enforced source of truth; changing either side requires
// updating the other.
//
// Only 6 types - not one per business event this app has. invoice_*/
// payment_received events were deliberately left out: invoices/payments
// have no created_by/uploaded_by column (confirmed live), so there's no
// real user to notify without inventing a recipient. Add those event
// types only alongside a migration that adds an actor column to those
// tables.
export const NOTIFICATION_TYPES = [
  "booking_created",
  "booking_status_changed",
  "visa_created",
  "visa_status_changed",
  "document_uploaded",
  "document_deleted",
] as const;

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  booking_created: "Booking Created",
  booking_status_changed: "Booking Status Changed",
  visa_created: "Visa Application Created",
  visa_status_changed: "Visa Status Changed",
  document_uploaded: "Document Uploaded",
  document_deleted: "Document Deleted",
};
