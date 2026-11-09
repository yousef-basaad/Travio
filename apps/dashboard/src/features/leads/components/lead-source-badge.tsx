"use client";

import type { CrmLeadSource } from "@travio/api";
import { useT } from "@/lib/i18n/i18n-provider";
import { LEAD_SOURCE_KEYS } from "../utils/label-keys";

// Source has no positive/negative connotation like status does, so it
// always uses the same neutral existing token rather than a per-value map.
export function LeadSourceBadge({ source }: { source: CrmLeadSource }) {
  const t = useT();
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {t(LEAD_SOURCE_KEYS[source])}
    </span>
  );
}
