import { StatusBadge } from "@travio/ui";
import type { Customer } from "@travio/api";

// Not currently rendered in customers-table.tsx - its column list
// (Full Name/Email/Phone/Passport Expiry/Preferred Language/Actions) has
// no Status column, and customerService.list()/getById() already filter
// out soft-deleted rows, so every customer shown there would always read
// "Active" today anyway. This exists as ready-to-use scaffolding for a
// future view (e.g. Customer 360) that may surface deletedAt directly,
// same as useConvertLead() was added ahead of its own UI in an earlier
// issue.
//
// Uses the design system's shared StatusBadge/Badge (packages/ui) -
// Active maps onto variant="neutral" (bg-secondary text-secondary-
// foreground) and Inactive onto variant="danger" (bg-danger/10
// text-danger, which renders identically to the bg-destructive/10
// text-destructive this file used to hardcode, since --danger is the
// same hue as --destructive). Pixel-identical to the previous markup.
export function CustomerStatusBadge({ customer }: { customer: Pick<Customer, "deletedAt"> }) {
  const isActive = customer.deletedAt === null;

  return <StatusBadge label={isActive ? "Active" : "Inactive"} variant={isActive ? "neutral" : "danger"} />;
}
