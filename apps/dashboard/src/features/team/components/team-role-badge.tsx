"use client";

import { cn } from "@travio/utils";
import type { UserRole } from "@travio/types";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Every role a profile can hold, for display - only 4 of these are ever
// assignable through this feature's own UI (see AssignableRole in
// team.api.ts); travio_admin/agency_owner/customer still need a label
// here since a real team roster includes the owner's own row, and
// travio_admin could theoretically appear if Travio staff are ever
// attached to a tenant.
export const TEAM_ROLE_KEYS: Record<UserRole, MessageKey> = {
  travio_admin: "role.travio_admin",
  agency_owner: "role.agency_owner",
  branch_manager: "role.branch_manager",
  sales_agent: "role.sales_agent",
  visa_officer: "role.visa_officer",
  accountant: "role.accountant",
  customer: "role.customer",
};

// Reuses only existing design tokens, matching BookingStatusBadge/
// LeadStatusBadge's approach - no new colors introduced.
const TEAM_ROLE_STYLES: Record<UserRole, string> = {
  travio_admin: "bg-primary text-primary-foreground",
  agency_owner: "bg-primary/10 text-primary",
  branch_manager: "bg-accent text-accent-foreground",
  sales_agent: "bg-secondary text-secondary-foreground",
  visa_officer: "bg-accent text-accent-foreground",
  accountant: "bg-accent text-accent-foreground",
  customer: "bg-secondary text-secondary-foreground",
};

export function TeamRoleBadge({ role }: { role: UserRole }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TEAM_ROLE_STYLES[role],
      )}
    >
      {t(TEAM_ROLE_KEYS[role])}
    </span>
  );
}
