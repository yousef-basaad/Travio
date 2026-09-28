"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import {
  Button,
  PageHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SearchInput,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { CrmLead } from "@travio/api";
import { useLeads } from "../api/leads.api";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { CreateLeadDialog } from "./create-lead-dialog";

// Phase UI-6: client-side search only (name/email/phone substring match
// over the already-fetched full list) - no new endpoint, same convention
// as CustomersTable's search.
function matchesSearch(lead: CrmLead, query: string): boolean {
  if (!query) return true;
  const haystack = `${lead.fullName} ${lead.email ?? ""} ${lead.phone ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

// Phase UI-6: rebuilt on the shared Table/DataTableState/PageHeader
// primitives (was hand-rolled raw <table>/<thead>/<tbody> markup that
// predated every design-system phase) - same data, same columns, now
// consistent with every other top-level table in this app. Also wires
// in LeadSourceBadge (previously defined but only used on the lead
// detail page, never in this table) instead of plain humanized text.
export function LeadsTable() {
  const { data: leads, isLoading, isError } = useLeads();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (leads ?? []).filter((lead) => matchesSearch(lead, query)),
    [leads, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Your sales pipeline, from first contact to won"
        actions={<Button onClick={() => setIsCreateOpen(true)}>New Lead</Button>}
      />

      <SearchInput
        placeholder="Search by name, email, or phone"
        aria-label="Search leads"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && filtered.length === 0}
        loadingLabel="Loading leads"
        errorMessage="Something went wrong loading leads. Please try again later."
        emptyMessage={query ? "No leads match your search" : "No leads yet"}
        emptyIcon={<UserPlus size={20} />}
        emptyAction={
          !query ? <Button onClick={() => setIsCreateOpen(true)}>New Lead</Button> : undefined
        }
        size="page"
      >
        <Table aria-label="CRM leads" caption="List of CRM leads, newest first">
          <TableHeader>
            <TableRow>
              <TableCell header>Name</TableCell>
              <TableCell header>Phone</TableCell>
              <TableCell header>Email</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Source</TableCell>
              <TableCell header>Assigned To</TableCell>
              <TableCell header>Created</TableCell>
              <TableCell header>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium text-foreground">{lead.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{lead.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{lead.source ? <LeadSourceBadge source={lead.source} /> : "—"}</TableCell>
                {/* Raw id, not a resolved name - no profiles join exists yet. */}
                <TableCell className="text-muted-foreground" title={lead.assignedTo ?? undefined}>
                  {lead.assignedTo ? `${lead.assignedTo.slice(0, 8)}…` : "Unassigned"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.createdAt ? formatDate(lead.createdAt) : "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/leads/${lead.id}`} aria-label={`View ${lead.fullName}`}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      <CreateLeadDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
