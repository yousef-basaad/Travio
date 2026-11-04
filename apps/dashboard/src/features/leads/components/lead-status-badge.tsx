"use client";

import type { CrmLeadStatus } from "@travio/api";
import { cn } from "@travio/utils";
import { useT } from "@/lib/i18n/i18n-provider";
import { LEAD_STATUS_KEYS } from "../utils/label-keys";

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

export function LeadStatusBadge({ status }: { status: CrmLeadStatus }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-fast ease-default",
        STATUS_STYLES[status],
      )}
    >
      {t(LEAD_STATUS_KEYS[status])}
    </span>
  );
}
