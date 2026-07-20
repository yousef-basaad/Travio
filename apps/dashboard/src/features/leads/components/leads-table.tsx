"use client";

import { Button } from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useLeads } from "../api/leads.api";
import { LeadStatusBadge } from "./lead-status-badge";

function humanize(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function LeadsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading leads" className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-10 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

function LeadsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
    >
      Something went wrong loading leads. Please try again later.
    </div>
  );
}

function LeadsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
      <h2 className="text-lg font-medium">No leads yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Create your first CRM lead to start managing your sales pipeline.
      </p>
      <Button
        className="mt-2"
        disabled
        aria-disabled="true"
        title="Lead creation isn't available yet"
      >
        New Lead
      </Button>
    </div>
  );
}

export function LeadsTable() {
  const { data: leads, isLoading, isError } = useLeads();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Leads</h1>

      {isLoading ? (
        <LeadsTableSkeleton />
      ) : isError ? (
        <LeadsErrorState />
      ) : !leads || leads.length === 0 ? (
        <LeadsEmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="CRM leads">
            <caption className="sr-only">List of CRM leads, newest first</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Name
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Phone
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Email
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Status
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Source
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Assigned To
                </th>
                <th scope="col" className="whitespace-nowrap py-2 pr-4">
                  Created
                </th>
                <th scope="col" className="whitespace-nowrap py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="py-2 pr-4">{lead.fullName}</td>
                  <td className="py-2 pr-4">{lead.phone ?? "—"}</td>
                  <td className="py-2 pr-4">{lead.email ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="py-2 pr-4">{lead.source ? humanize(lead.source) : "—"}</td>
                  <td className="py-2 pr-4" title={lead.assignedTo ?? undefined}>
                    {lead.assignedTo ? `${lead.assignedTo.slice(0, 8)}…` : "Unassigned"}
                  </td>
                  <td className="py-2 pr-4">
                    {lead.createdAt ? formatDate(lead.createdAt) : "—"}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      aria-disabled="true"
                      aria-label={`View ${lead.fullName}`}
                      title="Lead detail view isn't available yet"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
