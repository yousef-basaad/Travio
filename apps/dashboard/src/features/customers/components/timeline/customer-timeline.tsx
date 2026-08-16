"use client";

import { History } from "lucide-react";
import { Timeline, EmptyState, Skeleton } from "@travio/ui";
import { useCustomerTimeline } from "../../api/customers.api";
import { CustomerTimelineItem } from "./customer-timeline-item";

function TimelineSkeleton() {
  return (
    <div role="status" aria-label="Loading timeline" className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function TimelineErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading the timeline. Please try again later.
    </div>
  );
}

function TimelineEmptyState() {
  return <EmptyState icon={<History size={20} />} message="No timeline yet" />;
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
    <Timeline>
      {timeline.map((item, index) => (
        <CustomerTimelineItem key={item.id} item={item} isLast={index === timeline.length - 1} />
      ))}
    </Timeline>
  );
}
