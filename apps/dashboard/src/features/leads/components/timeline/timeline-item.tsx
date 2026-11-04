"use client";

import type { CrmTimelineItem } from "@travio/api";
import { ACTIVITY_ICONS } from "../activities/activity-item";
import { isCrmActivityType } from "../activities/create-activity-dialog";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const NON_ACTIVITY_ICONS: Record<Exclude<CrmTimelineItem["type"], "activity">, string> = {
  lead_created: "✨",
  note: "📝",
};

const FALLBACK_ACTIVITY_ICON = "📌";

// Single place this mapping is assembled: lead_created/note icons live
// here, and activity icons are reused from activity-item.tsx's own
// ACTIVITY_ICONS (the single source of truth for that mapping) rather
// than redefined.
function getTimelineIcon(item: CrmTimelineItem): string {
  if (item.type === "activity") {
    const activityType = item.metadata?.activityType;
    if (typeof activityType === "string" && isCrmActivityType(activityType)) {
      return ACTIVITY_ICONS[activityType];
    }
    return FALLBACK_ACTIVITY_ICON;
  }

  return NON_ACTIVITY_ICONS[item.type];
}

// The API builds English titles for system events; derive them from the
// event type here so they follow the UI language. Activity titles are
// user-entered and shown as-is.
function useTimelineTitle(item: CrmTimelineItem): string {
  const t = useT();
  if (item.type === "note") return t("leads.timeline.noteAdded");
  if (item.type === "lead_created" && typeof item.metadata?.fullName === "string") {
    return t("leads.timeline.created", { name: item.metadata.fullName });
  }
  return item.title;
}

export function TimelineItem({ item }: { item: CrmTimelineItem }) {
  const title = useTimelineTitle(item);
  const format = useFormat();
  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      <span aria-hidden="true" className="text-lg leading-none">
        {getTimelineIcon(item)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {item.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
        )}
        <p className="text-xs text-muted-foreground" title={format.date(item.createdAt)}>
          {format.relativeTime(item.createdAt)}
        </p>
      </div>
    </li>
  );
}
