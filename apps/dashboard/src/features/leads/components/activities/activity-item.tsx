import type { CrmActivity, CrmActivityType } from "@travio/api";
import { Button } from "@travio/ui";
import { formatDate } from "@travio/utils";

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

const ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  whatsapp: "WhatsApp",
  task: "Task",
  follow_up: "Follow-up",
};

type ActivityItemProps = {
  activity: CrmActivity;
  onEdit: (activity: CrmActivity) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function ActivityItem({ activity, onEdit, onDelete, isDeleting }: ActivityItemProps) {
  return (
    <li className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{ACTIVITY_ICONS[activity.type]}</span>
          <span className="text-sm font-medium">{activity.title}</span>
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(activity)}
            aria-label="Edit activity"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(activity.id)}
            disabled={isDeleting}
            aria-label="Delete activity"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
      {activity.description && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {activity.description}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {activity.performedAt ? formatDate(activity.performedAt) : "—"}
      </p>
    </li>
  );
}
