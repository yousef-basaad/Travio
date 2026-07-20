import type { CrmLeadStatus } from "@travio/api";
import { cn } from "@travio/utils";

// Reuses only existing design tokens (secondary/accent/primary/destructive
// from packages/ui/src/styles/globals.css) - no new colors introduced.
const STATUS_STYLES: Record<CrmLeadStatus, string> = {
  new: "bg-secondary text-secondary-foreground",
  contacted: "bg-accent text-accent-foreground",
  qualified: "bg-primary/10 text-primary",
  proposal_sent: "bg-primary/20 text-primary",
  won: "bg-primary text-primary-foreground",
  lost: "bg-destructive/10 text-destructive",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
