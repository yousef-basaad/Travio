"use client";

import { useCustomerTimeline } from "../../api/customers.api";
import { CustomerTimelineItem } from "./customer-timeline-item";

function TimelineSkeleton() {
  return (
    <div role="status" aria-label="Loading timeline" className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-16 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

function TimelineErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
    >
      Something went wrong loading the timeline. Please try again later.
    </div>
  );
}

function TimelineEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm text-muted-foreground">No timeline yet</p>
    </div>
  );
}

// Bare (no Card wrapper), unlike features/leads' LeadTimeline - this
// renders inside CustomerTabs' own Card/CardContent as one of several
// tabs, not as a standalone page section, so it doesn't need its own
// Card. Ordering (newest first) is applied server-side by
// customerTimelineService - never sorted here.
export function CustomerTimeline({ customerId }: { customerId: string }) {
  const { data: timeline, isLoading, isError } = useCustomerTimeline(customerId);

  const hasItems = !isLoading && !isError && !!timeline && timeline.length > 0;

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (isError) {
    return <TimelineErrorState />;
  }

  if (!hasItems) {
    return <TimelineEmptyState />;
  }

  return (
    <ul className="space-y-2">
      {timeline.map((item) => (
        <CustomerTimelineItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
