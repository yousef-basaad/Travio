import type { ReactNode } from "react";
import { cn } from "@travio/utils";
import { EmptyState } from "../empty-state";
import { SkeletonTable } from "../skeleton";

export interface DataTableStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  /** Number of pulsing skeleton bars to render while loading. */
  skeletonRows?: number;
  loadingLabel?: string;
  errorMessage?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  /**
   * Design System v2.3: optional icon for the empty state (forwarded to
   * EmptyState's own `icon` slot) - lets a list/table's "nothing here
   * yet" moment read as designed rather than a bare line of text,
   * without every caller re-implementing EmptyState directly.
   */
  emptyIcon?: ReactNode;
  /**
   * "inline" (default) matches every nested-in-card list in this app
   * (flights/hotels/transfers/invoices/payments/visas - the majority
   * convention). "page" matches the 3 top-level table pages
   * (bookings/customers/leads), which use a slightly larger error box.
   */
  size?: "inline" | "page";
  /** The populated view, rendered once loaded/non-empty/non-error. */
  children: ReactNode;
}

// Formalizes the loading/error/empty three-way branch repeated at the
// top of every list and table component in this app (skeleton bars +
// a role="alert" error box + EmptyState). Same markup, now shared -
// picks up the majority "inline" sizing by default.
export function DataTableState({
  isLoading,
  isError,
  isEmpty,
  skeletonRows = 5,
  loadingLabel = "Loading",
  errorMessage = "Something went wrong loading this data. Please try again later.",
  emptyMessage = "Nothing here yet",
  emptyAction,
  emptyIcon,
  size = "inline",
  children,
}: DataTableStateProps) {
  if (isLoading) {
    // Phase UI-Premium-1: only "page" tables (Customers/Leads/Bookings)
    // render a real <thead> - the "inline" majority (flights/notes/
    // payments/... nested in a card) never do, so their loading state
    // skips SkeletonTable's header bar rather than implying a header
    // row that the loaded content won't actually have.
    return <SkeletonTable rows={skeletonRows} header={size === "page"} aria-label={loadingLabel} />;
  }

  if (isError) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-md border border-danger/50 bg-danger/10 text-sm text-danger",
          size === "page" ? "rounded-lg p-6" : "p-4",
        )}
      >
        {errorMessage}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} action={emptyAction} icon={emptyIcon} />;
  }

  return <>{children}</>;
}
