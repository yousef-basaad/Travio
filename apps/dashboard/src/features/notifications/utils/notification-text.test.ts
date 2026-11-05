import { describe, it, expect } from "vitest";
import { translate } from "@/lib/i18n/translate";
import type { Translate } from "@/lib/i18n/translate";
import { notificationText } from "./notification-text";

const en: Translate = (key, vars) => translate("en", key, vars);
const ar: Translate = (key, vars) => translate("ar", key, vars);

const stored = { title: "Stored title", message: "Stored message" };

describe("notificationText", () => {
  it("builds the booking status message from metadata in both languages", () => {
    const notification = {
      ...stored,
      type: "booking_status_changed" as const,
      metadata: { bookingNumber: "BK-1", previousStatus: "pending", newStatus: "confirmed" },
    };
    expect(notificationText(notification, en)).toEqual({
      title: "Booking status changed",
      message: "Booking BK-1 status changed from Pending to Confirmed.",
    });
    expect(notificationText(notification, ar)).toEqual({
      title: "تغيّرت حالة الحجز",
      message: "تغيّرت حالة الحجز BK-1 من «قيد الانتظار» إلى «مؤكد».",
    });
  });

  it("falls back to a generic sentence for rows without the detail in metadata", () => {
    expect(
      notificationText({ ...stored, type: "document_uploaded", metadata: { documentId: "d1" } }, ar).message,
    ).toBe("تم رفع مستند.");
    expect(notificationText({ ...stored, type: "booking_created", metadata: {} }, en).message).toBe(
      "A new booking was created.",
    );
  });

  it("labels a missing visa status instead of printing null", () => {
    const { message } = notificationText(
      { ...stored, type: "visa_status_changed", metadata: { previousStatus: null, newStatus: "approved" } },
      en,
    );
    expect(message).toBe("Visa application status changed from unset to Approved.");
  });

  it("keeps the stored text for an event type it doesn't know", () => {
    const unknown = { ...stored, type: "something_new", metadata: {} } as unknown as Parameters<
      typeof notificationText
    >[0];
    expect(notificationText(unknown, ar)).toEqual({ title: "Stored title", message: "Stored message" });
  });
});
