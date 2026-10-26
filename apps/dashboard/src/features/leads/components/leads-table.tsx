"use client";

import { useState } from "react";
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
  Pagination,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useLeadsPage } from "../api/leads.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { CreateLeadDialog } from "./create-lead-dialog";

// Phase UI-6: rebuilt on the shared Table/DataTableState/PageHeader
// primitives (was hand-rolled raw <table>/<thead>/<tbody> markup that
// predated every design-system phase) - same data, same columns, now
// consistent with every other top-level table in this app. Also wires
// in LeadSourceBadge (previously defined but only used on the lead
// detail page, never in this table) instead of plain humanized text.
export function LeadsTable() {
  // Server-side paging + search (name/email/phone), same as Customers.
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging();
  const { data, isLoading, isError, isFetching } = useLeadsPage({ page, pageSize, search: debouncedSearch });
  const leads = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && leads.length === 0}
        loadingLabel="Loading leads"
        errorMessage="Something went wrong loading leads. Please try again later."
        emptyMessage={debouncedSearch ? "No leads match your search" : "No leads yet"}
        emptyIcon={<UserPlus size={20} />}
        emptyAction={
          !debouncedSearch ? <Button onClick={() => setIsCreateOpen(true)}>New Lead</Button> : undefined
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
            {leads.map((lead) => (
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

      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          disabled={isFetching}
        />
      )}

      <CreateLeadDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
