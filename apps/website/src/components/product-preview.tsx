import type { ReactNode } from "react";
import { cn } from "@travio/utils";

export type ProductPreviewVariant = "analytics" | "customer-360" | "booking-360" | "generic";

export interface ProductPreviewProps {
  variant?: ProductPreviewVariant;
  className?: string;
}

// A static, decorative mock of the real dashboard shell - NOT a
// screenshot (no image asset exists or is claimed here) and not a live
// embed of the actual app (apps/website has no session/auth context to
// render it in). Built from the same design tokens the real dashboard
// uses (bg-sidebar, bg-card, border, shadow, rounded-lg, the status
// palette) so its shape/proportions honestly reflect what each real
// view already looks like (confirmed against the actual Analytics/
// Customer 360/Booking 360 pages - AppSidebar's nav groups, AppHeader's
// breadcrumb, StatsCard grids, DetailLayout's tab strip) without
// reusing @travio/ui's actual layout components (those assume a real
// pathname/router/session this app doesn't have).
function Bar({ width, tone = "muted" }: { width: string; tone?: "muted" | "primary" | "accent" }) {
  const toneClass =
    tone === "primary" ? "bg-primary/70" : tone === "accent" ? "bg-info/60" : "bg-muted-foreground/20";
  return <div className={cn("h-2 rounded-full", toneClass)} style={{ width }} />;
}

function MockSidebar() {
  return (
    <div className="hidden w-36 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 sm:flex">
      <div className="flex items-center gap-1.5 pb-2">
        <span className="h-5 w-5 rounded bg-primary" aria-hidden="true" />
        <Bar width="40px" />
      </div>
      {["70%", "55%", "80%", "60%"].map((width, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5",
            index === 0 && "bg-sidebar-hover",
          )}
        >
          <span className="h-3 w-3 shrink-0 rounded-sm bg-muted-foreground/30" aria-hidden="true" />
          <Bar width={width} />
        </div>
      ))}
    </div>
  );
}

function MockHeader({ title }: { title: string }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
      <p className="text-xs font-medium text-muted-foreground">Travio / {title}</p>
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-full bg-muted" aria-hidden="true" />
        <span className="h-5 w-5 rounded-full bg-muted" aria-hidden="true" />
      </div>
    </div>
  );
}

function MockStatsRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-md border border-border bg-card p-2.5">
          <Bar width="60%" />
          <Bar width="40%" tone="primary" />
        </div>
      ))}
    </div>
  );
}

function AnalyticsBody() {
  return (
    <div className="space-y-3 p-4">
      <MockStatsRow />
      <div className="rounded-md border border-border bg-card p-3">
        <Bar width="35%" />
        <div className="mt-3 flex h-16 items-end gap-1">
          {[40, 65, 50, 80, 60, 90, 70].map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-sm bg-primary/60"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Customer360Body() {
  return (
    <div className="flex gap-3 p-4">
      <div className="w-24 shrink-0 space-y-2 rounded-md border border-border bg-card p-2.5">
        <span className="block h-6 w-6 rounded-full bg-muted" aria-hidden="true" />
        <Bar width="80%" />
        <Bar width="60%" />
        <Bar width="70%" />
      </div>
      <div className="flex-1 space-y-2 rounded-md border border-border bg-card p-2.5">
        <div className="flex gap-2">
          {["Overview", "Bookings", "Finance"].map((tab, index) => (
            <span
              key={tab}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-medium",
                index === 0 ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <Bar width="90%" />
        <Bar width="75%" />
        <Bar width="85%" />
      </div>
    </div>
  );
}

function Booking360Body() {
  return (
    <div className="space-y-3 p-4">
      <MockStatsRow count={4} />
      <div className="space-y-2 rounded-md border border-border bg-card p-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center justify-between gap-2">
            <Bar width="30%" />
            <Bar width="15%" tone="accent" />
            <Bar width="20%" />
          </div>
        ))}
      </div>
    </div>
  );
}

const VARIANT_CONFIG: Record<ProductPreviewVariant, { title: string; body: () => ReactNode }> = {
  analytics: { title: "Analytics", body: AnalyticsBody },
  "customer-360": { title: "Customers", body: Customer360Body },
  "booking-360": { title: "Bookings", body: Booking360Body },
  generic: { title: "Dashboard", body: AnalyticsBody },
};

export function ProductPreview({ variant = "generic", className }: ProductPreviewProps) {
  const { title, body: Body } = VARIANT_CONFIG[variant];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background shadow-lg",
        className,
      )}
      role="img"
      aria-label={`Illustrative preview of the Travio ${title} view`}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/60" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" aria-hidden="true" />
      </div>
      <div className="flex">
        <MockSidebar />
        <div className="flex-1">
          <MockHeader title={title} />
          <Body />
        </div>
      </div>
    </div>
  );
}
