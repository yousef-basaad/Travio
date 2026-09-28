import * as React from "react";
import { cn } from "@travio/utils";

// Layout-only primitives for a single row in a booking-service list
// (flights/hotels/transfers, ...). Purely structural - no awareness of
// what a "flight" or "hotel" is, and no field rendering: every feature's
// own *-item.tsx still writes its own labels/values/badges as children.
// Mirrors Card/CardHeader/CardContent's sibling-export convention.

export const ServiceItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("space-y-2 rounded-md border p-3", className)} {...props} />
  ),
);
ServiceItem.displayName = "ServiceItem";

// The row that holds a service's title/badges on the left and its
// actions slot on the right (justify-between).
export const ServiceItemHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap items-start justify-between gap-2", className)}
    {...props}
  />
));
ServiceItemHeader.displayName = "ServiceItemHeader";

// Actions slot (Edit/Delete buttons), rendered inside ServiceItemHeader.
export const ServiceItemActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center gap-1", className)} {...props} />
));
ServiceItemActions.displayName = "ServiceItemActions";

// Content area below the header - the detail lines (route, dates,
// confirmation number, etc.) each feature writes for itself.
export const ServiceItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
));
ServiceItemContent.displayName = "ServiceItemContent";
