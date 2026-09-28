import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@travio/utils";

// Formalizes a pattern that was previously copy-pasted independently in
// BookingStatusBadge/LeadStatusBadge/CustomerStatusBadge/invoice status/
// item type/payment method badges (each defining its own
// "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
// span with a locally-owned color map). Same markup, now shared.
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-fast ease-default",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
        info: "bg-info/10 text-info",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
