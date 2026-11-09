"use client";

import type { ReactNode } from "react";
import { CalendarPlus, Pencil, ArrowRightLeft, Circle } from "lucide-react";
import { TimelineItem } from "@travio/ui";
import type { BookingTimelineEvent, BookingTimelineEventType } from "../../types/booking";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import { isMessageKey, type Translate } from "@/lib/i18n/translate";

// Centralized here - the only place booking timeline icons/titles are
// mapped. booking_timeline has no title column (see the migration), so
// the title is derived from type - a plain lookup (not a
// Record<BookingTimelineEventType, string>) so a future event type the
// frontend doesn't know about yet falls back to the generic icon/label
// instead of failing to compile or render, same reasoning as
// CustomerTimelineItem's icon map.
//
// Product-2: lucide-react icons (was emoji) - matches the icon
// vocabulary the rest of the design system already uses everywhere else
// (sidebar nav, StatsCard, EmptyState), which the emoji set predated.
const ICON_SIZE = 14;

const BOOKING_TIMELINE_ICONS: Record<string, ReactNode> = {
  booking_created: <CalendarPlus size={ICON_SIZE} />,
  booking_updated: <Pencil size={ICON_SIZE} />,
  status_changed: <ArrowRightLeft size={ICON_SIZE} />,
};

const FALLBACK_ICON = <Circle size={ICON_SIZE} />;

function getTimelineIcon(type: BookingTimelineEventType): ReactNode {
  return BOOKING_TIMELINE_ICONS[type] ?? FALLBACK_ICON;
}

// status_changed rows store an English description; rebuild it from the
// from/to statuses in metadata so it follows the UI language.
function eventDescription(event: BookingTimelineEvent, t: Translate): string | null | undefined {
  const meta = event.metadata as { from?: unknown; to?: unknown } | null | undefined;
  if (
    event.type !== "status_changed" ||
    typeof meta?.from !== "string" ||
    typeof meta?.to !== "string"
  ) {
    return event.description;
  }
  const label = (status: string) => {
    const key = `bookingStatus.${status}`;
    return isMessageKey(key) ? t(key) : status;
  };
  return t("bookings.timeline.statusChangedFrom", { from: label(meta.from), to: label(meta.to) });
}

export function BookingTimelineItem({
  event,
  isLast,
}: {
  event: BookingTimelineEvent;
  isLast?: boolean;
}) {
  const t = useT();
  const format = useFormat();
  // Known event types have a translated title; anything else shows its raw type.
  const titleKey = `bookings.timeline.${event.type}`;
  const title = isMessageKey(titleKey) ? t(titleKey) : event.type;
  return (
    <TimelineItem
      icon={getTimelineIcon(event.type)}
      title={title}
      description={eventDescription(event, t)}
      timestamp={event.createdAt ? format.relativeTime(event.createdAt) : null}
      timestampTitle={event.createdAt ? format.date(event.createdAt) : undefined}
      // Raw id - no profiles join exists anywhere yet (same convention
      // as assignedTo elsewhere), never fabricated as a display name.
      actor={event.createdBy}
      isLast={isLast}
    />
  );
}
