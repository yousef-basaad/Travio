import type { Database } from "@travio/database";
import { notificationTypeSchema, type NotificationType } from "@travio/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsertRow = Database["public"]["Tables"]["notifications"]["Insert"];

export type { NotificationType };

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export function toNotification(row: NotificationRow): Notification {
  // type is text + CHECK, not a real Postgres enum (see the migration's
  // own reasoning) - validated against the same notificationTypeSchema
  // every other layer uses, same guard pattern as document.mapper.ts's
  // toDocument.
  const type = notificationTypeSchema.parse(row.type);

  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    type,
    title: row.title,
    message: row.message,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function toNotificationInsert(input: CreateNotificationInput): NotificationInsertRow {
  return {
    tenant_id: input.tenantId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    // metadata is a free-form domain object (Record<string, unknown>) -
    // the generated Json type requires an explicit cast, same as any
    // jsonb column with an app-defined shape.
    metadata: (input.metadata ?? {}) as NotificationInsertRow["metadata"],
  };
}
