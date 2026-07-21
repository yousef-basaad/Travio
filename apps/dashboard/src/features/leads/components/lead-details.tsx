"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useLead, LeadNotFoundError } from "../api/leads.api";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { EmptyState } from "./empty-state";
import { EditLeadDialog } from "./edit-lead-dialog";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { LeadNotes } from "./notes/lead-notes";
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
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

function LeadNotFoundState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center">
      <h1 className="text-lg font-medium">Lead not found</h1>
      <BackToLeadsLink />
    </div>
  );
}

function LeadDetailsErrorState() {
  return (
    <div className="space-y-4">
      <BackToLeadsLink />
      <div
        role="alert"
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
      >
        Something went wrong loading this lead. Please try again later.
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
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
    <div className="space-y-6">
      <BackToLeadsLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">{lead.fullName}</h1>
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

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Activities</h2>
        </CardHeader>
        <CardContent>
          <EmptyState message="No activities yet." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Timeline</h2>
        </CardHeader>
        <CardContent>
          <EmptyState message="Timeline coming soon." />
        </CardContent>
      </Card>

      <EditLeadDialog lead={lead} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <ConvertLeadDialog lead={lead} open={isConvertOpen} onOpenChange={setIsConvertOpen} />
    </div>
  );
}
