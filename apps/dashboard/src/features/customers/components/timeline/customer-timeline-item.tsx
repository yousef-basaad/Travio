"use client";

import { TimelineItem } from "@travio/ui";
import type { CustomerTimelineItem as CustomerTimelineItemData } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Centralized here - the only place customer timeline icons are mapped.
// A plain lookup (not a Record<CustomerTimelineItemType, string>) so a
// future item type the frontend doesn't know about yet falls back to the
// generic icon instead of failing to compile or render.
const CUSTOMER_TIMELINE_ICONS: Record<string, string> = {
  customer_created: "👤",
  lead_converted: "🔄",
};

const FALLBACK_ICON = "📌";

function getTimelineIcon(item: CustomerTimelineItemData): string {
  return CUSTOMER_TIMELINE_ICONS[item.type] ?? FALLBACK_ICON;
}

// customer_timeline has no actor/created_by concept (it's a synthesized
// composite of customer_created/lead_converted events - see
// customer-timeline.mapper.ts) - no actor is passed to TimelineItem
// here, never fabricated.
export function CustomerTimelineItem({
  item,
  isLast,
}: {
  item: CustomerTimelineItemData;
  isLast?: boolean;
}) {
  const format = useFormat();
  const t = useT();
  // Titles are built in English by the API; derive them from the item
  // type so they follow the UI language.
  const name = typeof item.metadata?.fullName === "string" ? item.metadata.fullName : null;
  const title =
    name && item.type === "customer_created"
      ? t("customers.timeline.created", { name })
      : name && item.type === "lead_converted"
        ? t("customers.timeline.leadConverted", { name })
        : item.title;
  return (
    <TimelineItem
      icon={getTimelineIcon(item)}
      title={title}
      description={item.description}
      timestamp={format.relativeTime(item.createdAt)}
      timestampTitle={format.date(item.createdAt)}
      isLast={isLast}
    />
  );
}
