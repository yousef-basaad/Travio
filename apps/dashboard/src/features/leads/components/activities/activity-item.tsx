"use client";

import type { CrmActivity, CrmActivityType } from "@travio/api";
import { Button } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import { ACTIVITY_TYPE_KEYS } from "../../utils/label-keys";

// Single source of truth for the type -> icon mapping. Exported so
// timeline-item.tsx reuses it for activity-type timeline entries instead
// of duplicating it.
export const ACTIVITY_ICONS: Record<CrmActivityType, string> = {
  call: "📞",
  email: "📧",
  meeting: "🤝",
  whatsapp: "💬",
  task: "✅",
  follow_up: "🔄",
};

type ActivityItemProps = {
  activity: CrmActivity;
  onEdit: (activity: CrmActivity) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function ActivityItem({ activity, onEdit, onDelete, isDeleting }: ActivityItemProps) {
  const t = useT();
  const format = useFormat();
  return (
    <li className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{ACTIVITY_ICONS[activity.type]}</span>
          <span className="text-sm font-medium">{activity.title}</span>
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {t(ACTIVITY_TYPE_KEYS[activity.type])}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(activity)}
            aria-label={t("leads.activities.edit")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(activity.id)}
            disabled={isDeleting}
            aria-label={t("leads.activities.delete")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </div>
      </div>
      {activity.description && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {activity.description}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {activity.performedAt ? format.date(activity.performedAt) : "—"}
      </p>
    </li>
  );
}
