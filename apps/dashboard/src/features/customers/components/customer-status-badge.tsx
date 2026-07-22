import type { Customer } from "@travio/api";
import { cn } from "@travio/utils";

// Reuses only existing design tokens (secondary/destructive), matching
// LeadStatusBadge's approach - no new colors introduced.
//
// Not currently rendered in customers-table.tsx - its column list
// (Full Name/Email/Phone/Passport Expiry/Preferred Language/Actions) has
// no Status column, and customerService.list()/getById() already filter
// out soft-deleted rows, so every customer shown there would always read
// "Active" today anyway. This exists as ready-to-use scaffolding for a
// future view (e.g. Customer 360) that may surface deletedAt directly,
// same as useConvertLead() was added ahead of its own UI in an earlier
// issue.
export function CustomerStatusBadge({ customer }: { customer: Pick<Customer, "deletedAt"> }) {
  const isActive = customer.deletedAt === null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isActive ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
