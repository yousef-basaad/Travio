import type { Notification } from "@travio/api";
import { isMessageKey, type Translate } from "@/lib/i18n/translate";

// notifications.title/message are stored in English at write time. The
// UI rebuilds both from type + metadata so they follow the viewer's
// language; the stored text is only the fallback for an event type this
// map doesn't know. Rows written before metadata carried the booking
// number / file name / country get the generic sentence instead.

function text(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function statusLabel(t: Translate, prefix: string, status: unknown): string {
  if (typeof status !== "string" || status === "") return t("visa.status.unset");
  const key = `${prefix}${status}`;
  return isMessageKey(key) ? t(key) : status;
}

export function notificationText(
  notification: Pick<Notification, "type" | "title" | "message" | "metadata">,
  t: Translate,
): { title: string; message: string } {
  const metadata = notification.metadata ?? {};

  switch (notification.type) {
    case "booking_created": {
      const number = text(metadata, "bookingNumber");
      return {
        title: t("notifications.event.bookingCreated"),
        message: number
          ? t("notifications.event.bookingCreatedMessage", { number })
          : t("notifications.event.bookingCreatedGeneric"),
      };
    }
    case "booking_status_changed": {
      const number = text(metadata, "bookingNumber");
      const from = statusLabel(t, "bookingStatus.", metadata.previousStatus);
      const to = statusLabel(t, "bookingStatus.", metadata.newStatus);
      return {
        title: t("notifications.event.bookingStatusChanged"),
        message: number
          ? t("notifications.event.bookingStatusChangedMessage", { number, from, to })
          : t("notifications.event.bookingStatusChangedGeneric", { from, to }),
      };
    }
    case "visa_created": {
      const country = text(metadata, "country");
      return {
        title: t("notifications.event.visaCreated"),
        message: country
          ? t("notifications.event.visaCreatedMessage", { country })
          : t("notifications.event.visaCreatedGeneric"),
      };
    }
    case "visa_status_changed":
      return {
        title: t("notifications.event.visaStatusChanged"),
        message: t("notifications.event.visaStatusChangedMessage", {
          from: statusLabel(t, "visa.status.", metadata.previousStatus),
          to: statusLabel(t, "visa.status.", metadata.newStatus),
        }),
      };
    case "document_uploaded": {
      const name = text(metadata, "fileName");
      return {
        title: t("notifications.event.documentUploaded"),
        message: name
          ? t("notifications.event.documentUploadedMessage", { name })
          : t("notifications.event.documentUploadedGeneric"),
      };
    }
    case "document_deleted": {
      const name = text(metadata, "fileName");
      return {
        title: t("notifications.event.documentDeleted"),
        message: name
          ? t("notifications.event.documentDeletedMessage", { name })
          : t("notifications.event.documentDeletedGeneric"),
      };
    }
    default:
      return { title: notification.title, message: notification.message };
  }
}
