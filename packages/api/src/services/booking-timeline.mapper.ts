import type { Database } from "@travio/database";

type BookingTimelineRow = Database["public"]["Tables"]["booking_timeline"]["Row"];
type BookingTimelineInsertRow = Database["public"]["Tables"]["booking_timeline"]["Insert"];

// booking_timeline.type is plain text + a CHECK constraint
// (booking_timeline_type_check), not a Postgres enum - same reasoning as
// CrmActivityType: this array is the single source of truth for the
// domain-level type and the runtime guard below.
const BOOKING_TIMELINE_TYPES = ["booking_created", "booking_updated", "status_changed"] as const;

export type BookingTimelineEventType = (typeof BOOKING_TIMELINE_TYPES)[number];

function isBookingTimelineEventType(value: string): value is BookingTimelineEventType {
  return (BOOKING_TIMELINE_TYPES as readonly string[]).includes(value);
}

export interface BookingTimelineEvent {
  id: string;
  tenantId: string;
  bookingId: string;
  createdBy: string | null;
  type: BookingTimelineEventType;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface CreateBookingTimelineEventInput {
  tenantId: string;
  bookingId: string;
  type: BookingTimelineEventType;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export function toBookingTimelineEvent(row: BookingTimelineRow): BookingTimelineEvent {
  if (!isBookingTimelineEventType(row.type)) {
    // Should be unreachable given booking_timeline_type_check, but the DB
    // column is untyped text - fail loudly rather than silently lying
    // about the type to callers.
    throw new Error(`Unexpected booking_timeline.type value: ${row.type}`);
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    bookingId: row.booking_id,
    createdBy: row.created_by,
    type: row.type,
    description: row.description,
    // metadata is jsonb (Json | null in the generated Row type) - the
    // object variant of Json is structurally a Record<string, unknown>,
    // and every write goes through toBookingTimelineEventInsert below, so
    // this narrowing is safe.
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.created_at,
  };
}

export function toBookingTimelineEventInsert(
  input: CreateBookingTimelineEventInput,
): BookingTimelineInsertRow {
  return {
    tenant_id: input.tenantId,
    booking_id: input.bookingId,
    type: input.type,
    description: input.description ?? null,
    metadata: (input.metadata ?? null) as BookingTimelineInsertRow["metadata"],
    created_by: input.createdBy ?? null,
  };
}
