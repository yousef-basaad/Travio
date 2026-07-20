import type { CrmLeadSource } from "@travio/api";
import { humanize } from "../utils/humanize";

// Source has no positive/negative connotation like status does, so it
// always uses the same neutral existing token rather than a per-value map.
export function LeadSourceBadge({ source }: { source: CrmLeadSource }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {humanize(source)}
    </span>
  );
}
