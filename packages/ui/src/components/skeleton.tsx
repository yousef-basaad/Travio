import { cn } from "@travio/utils";

export interface SkeletonProps {
  className?: string;
}

// Design System v2.0: the base pulsing block every skeleton below
// composes from - previously each loading state hand-rolled its own
// `animate-pulse rounded-md bg-muted` div inline (DataTableState,
// various dialogs). Same visual, now a single named primitive.
//
// Design System v2.4 (Product-8.1): a moving highlight sweep
// (bg-gradient + animate-shimmer, both from tokens.css/preset.ts) layered
// over the flat bg-muted base, instead of a bare opacity pulse - reads as
// "actively loading" the way the reference products' skeletons do. The
// overflow-hidden wrapper is required so the sweep's translateX(100%)
// keyframe doesn't spill past the block's own rounded corners.
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)} aria-hidden="true">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

export interface SkeletonCardProps {
  className?: string;
}

// Matches StatsCard/Card's own shape (label line + big value line) so a
// grid of loading KPI cards doesn't jump size once real data arrives.
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  /**
   * Phase UI-Premium-1: renders a header-row-shaped bar above the body
   * rows, inside the same bordered/rounded container Table itself uses -
   * on by default so a loading top-level table (Customers/Leads/
   * Bookings/Invoices) keeps its own shape instead of collapsing into a
   * looser stack of floating bars once it starts loading. DataTableState
   * passes `false` for its "inline" size (nested-in-card lists like
   * flights/notes/payments, which never render a real header row).
   */
  header?: boolean;
  className?: string;
  /** Defaults to "Loading" - DataTableState passes its own loadingLabel through. */
  "aria-label"?: string;
}

// Was a loose stack of full-width bars (space-y-2 + plain Skeleton
// rows) - Phase UI-Premium-1 wraps them in the same
// "rounded-lg border border-border" shell Table itself renders, with
// row dividers and an optional muted header bar, so a table's loading
// state already reads as "this specific table, still loading" instead
// of a generic placeholder that then pops into a bordered table once
// data arrives.
export function SkeletonTable({
  rows = 5,
  header = true,
  className,
  "aria-label": ariaLabel = "Loading",
}: SkeletonTableProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn("overflow-hidden rounded-lg border border-border", className)}
    >
      {header ? (
        <div className="flex items-center gap-6 border-b border-border bg-surface-muted px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-4 py-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

// Label-bar + control-bar pairs, matching FormField's own "<label> +
// control" shape.
export function SkeletonForm({ fields = 4, className }: SkeletonFormProps) {
  return (
    <div role="status" aria-label="Loading form" className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
