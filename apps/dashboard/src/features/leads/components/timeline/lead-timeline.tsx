"use client";

import { Card, CardContent, CardHeader } from "@travio/ui";
import { useLeadTimeline } from "../../api/leads.api";
import { TimelineItem } from "./timeline-item";

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
      <p className="text-sm text-muted-foreground">No activity yet</p>
    </div>
  );
}

// Read-only per ADR-0004 - no create/edit/delete here, unlike Notes and
// Activities. Ordering (newest first) is applied server-side by
// crmTimelineService, not here.
export function LeadTimeline({ leadId }: { leadId: string }) {
  const { data: timeline, isLoading, isError } = useLeadTimeline(leadId);

  const hasItems = !isLoading && !isError && !!timeline && timeline.length > 0;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">Timeline</h2>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : isError ? (
          <TimelineErrorState />
        ) : !hasItems ? (
          <TimelineEmptyState />
        ) : (
          <ul className="space-y-2">
            {timeline.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
