import { cn } from "@travio/utils";
import type { UserRole } from "@travio/types";

// Every role a profile can hold, for display - only 4 of these are ever
// assignable through this feature's own UI (see AssignableRole in
// team.api.ts); travio_admin/agency_owner/customer still need a label
// here since a real team roster includes the owner's own row, and
// travio_admin could theoretically appear if Travio staff are ever
// attached to a tenant.
export const TEAM_ROLE_LABELS: Record<UserRole, string> = {
  travio_admin: "Travio Admin",
  agency_owner: "Agency Owner",
  branch_manager: "Branch Manager",
  sales_agent: "Sales Agent",
  visa_officer: "Visa Officer",
  accountant: "Accountant",
  customer: "Customer",
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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TEAM_ROLE_STYLES[role],
      )}
    >
      {TEAM_ROLE_LABELS[role]}
    </span>
  );
}
