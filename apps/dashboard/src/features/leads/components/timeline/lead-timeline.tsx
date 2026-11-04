"use client";

import { History } from "lucide-react";
import { Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import { useLeadTimeline } from "../../api/leads.api";
import { TimelineItem } from "./timeline-item";
import { useT } from "@/lib/i18n/i18n-provider";

function TimelineSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("timeline.loading")} className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function TimelineErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      {t("timeline.error")}
    </div>
  );
}

function TimelineEmptyState() {
  const t = useT();
  return <EmptyState icon={<History size={20} />} message={t("leads.timeline.empty")} />;
}

// Read-only per ADR-0004 - no create/edit/delete here, unlike Notes and
// Activities. Ordering (newest first) is applied server-side by
// crmTimelineService, not here.
export function LeadTimeline({ leadId }: { leadId: string }) {
  const t = useT();
  const { data: timeline, isLoading, isError } = useLeadTimeline(leadId);

  const hasItems = !isLoading && !isError && !!timeline && timeline.length > 0;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">{t("customers.tab.timeline")}</h2>
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
