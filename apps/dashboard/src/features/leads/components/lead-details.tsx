"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, InfoRow, Skeleton } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useLead, LeadNotFoundError } from "../api/leads.api";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { EditLeadDialog } from "./edit-lead-dialog";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { LeadNotes } from "./notes/lead-notes";
import { ActivityList } from "./activities/activity-list";
import { LeadTimeline } from "./timeline/lead-timeline";
import { humanize } from "../utils/humanize";

function BackToLeadsLink() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/leads">← Back to Leads</Link>
    </Button>
  );
}

function LeadDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading lead" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function LeadNotFoundState() {
  return (
    <EmptyState
      className="p-12"
      icon={<SearchX size={20} />}
      title="Lead not found"
      action={<BackToLeadsLink />}
    />
  );
}

function LeadDetailsErrorState() {
  return (
    <div className="space-y-4">
      <BackToLeadsLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
      >
        Something went wrong loading this lead. Please try again later.
      </div>
    </div>
  );
}

export function LeadDetails({ id }: { id: string }) {
  const { data: lead, isLoading, error } = useLead(id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  if (isLoading) {
    return <LeadDetailsSkeleton />;
  }

  if (error instanceof LeadNotFoundError) {
    return <LeadNotFoundState />;
  }

  if (error || !lead) {
    return <LeadDetailsErrorState />;
  }

  return (
    <div className="space-y-8">
      <BackToLeadsLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-heading-lg text-foreground">{lead.fullName}</h1>
          <LeadStatusBadge status={lead.status} />
          {lead.source && <LeadSourceBadge source={lead.source} />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            Edit
          </Button>
          {lead.status !== "won" && (
            <Button onClick={() => setIsConvertOpen(true)}>Convert Lead</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Information</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Full Name" value={lead.fullName} />
            <InfoRow label="Email" value={lead.email ?? "—"} />
            <InfoRow label="Phone" value={lead.phone ?? "—"} />
            <InfoRow label="Source" value={lead.source ? humanize(lead.source) : "—"} />
            <InfoRow label="Status" value={<LeadStatusBadge status={lead.status} />} />
            <InfoRow
              label="Created At"
              value={lead.createdAt ? formatDate(lead.createdAt) : "—"}
            />
            <InfoRow
              label="Updated At"
              value={lead.updatedAt ? formatDate(lead.updatedAt) : "—"}
            />
            {/* No profiles join here by design - assigned_to is displayed
                as-is (raw id) until a name-resolution path exists. */}
            <InfoRow label="Assigned To" value={lead.assignedTo ?? "Unassigned"} />
          </dl>
        </CardContent>
      </Card>

      <LeadNotes leadId={lead.id} />

      <ActivityList leadId={lead.id} />

      <LeadTimeline leadId={lead.id} />

      <EditLeadDialog lead={lead} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <ConvertLeadDialog lead={lead} open={isConvertOpen} onOpenChange={setIsConvertOpen} />
    </div>
  );
}
