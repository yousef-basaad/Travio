import type { CrmLeadStatus } from "@travio/api";
import { cn } from "@travio/utils";

// Phase UI-6: retuned to the design system's semantic status vocabulary
// (success/warning/danger/info) instead of ad hoc primary-opacity tiers -
// won=success, lost=danger, qualified=warning (getting close), contacted=
// info (in progress), proposal_sent=primary (the "our move" stage),
// new=neutral. Same 6 states, no new colors introduced.
const STATUS_STYLES: Record<CrmLeadStatus, string> = {
  new: "bg-secondary text-secondary-foreground",
  contacted: "bg-info/10 text-info",
  qualified: "bg-warning/10 text-warning",
  proposal_sent: "bg-primary/10 text-primary",
  won: "bg-success/10 text-success",
  lost: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

export function LeadStatusBadge({ status }: { status: CrmLeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-fast ease-default",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
