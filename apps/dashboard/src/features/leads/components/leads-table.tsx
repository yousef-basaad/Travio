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
  LtrText,
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { useLeadsPage } from "../api/leads.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadSourceBadge } from "./lead-source-badge";
import { CreateLeadDialog } from "./create-lead-dialog";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Phase UI-6: rebuilt on the shared Table/DataTableState/PageHeader
// primitives (was hand-rolled raw <table>/<thead>/<tbody> markup that
// predated every design-system phase) - same data, same columns, now
// consistent with every other top-level table in this app. Also wires
// in LeadSourceBadge (previously defined but only used on the lead
// detail page, never in this table) instead of plain humanized text.
export function LeadsTable() {
  const t = useT();
  const format = useFormat();
  // Server-side paging + search (name/email/phone), same as Customers.
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging();
  const { data, isLoading, isError, isFetching } = useLeadsPage({ page, pageSize, search: debouncedSearch });
  const leads = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.leads")}
        description={t("leads.description")}
        actions={<Button onClick={() => setIsCreateOpen(true)}>{t("leads.new")}</Button>}
      />

      <SearchInput
        placeholder={t("customers.searchPlaceholder")}
        aria-label={t("leads.searchLabel")}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        containerClassName="max-w-sm"
      />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && leads.length === 0}
        loadingLabel={t("leads.loading")}
        errorMessage={t("leads.loadError")}
        emptyMessage={debouncedSearch ? t("leads.noMatch") : t("leads.empty")}
        emptyIcon={<UserPlus size={20} />}
        emptyAction={
          !debouncedSearch ? <Button onClick={() => setIsCreateOpen(true)}>{t("leads.new")}</Button> : undefined
        }
        size="page"
      >
        <Table aria-label={t("leads.tableLabel")} caption={t("leads.tableCaption")}>
          <TableHeader>
            <TableRow>
              <TableCell header>{t("common.name")}</TableCell>
              <TableCell header>{t("field.phone")}</TableCell>
              <TableCell header>{t("field.email")}</TableCell>
              <TableCell header>{t("common.status")}</TableCell>
              <TableCell header>{t("field.source")}</TableCell>
              <TableCell header>{t("field.assignedTo")}</TableCell>
              <TableCell header>{t("common.created")}</TableCell>
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium text-foreground">{lead.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{lead.phone ? <LtrText>{lead.phone}</LtrText> : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{lead.source ? <LeadSourceBadge source={lead.source} /> : "—"}</TableCell>
                {/* Raw id, not a resolved name - no profiles join exists yet. */}
                <TableCell className="text-muted-foreground" title={lead.assignedTo ?? undefined}>
                  {lead.assignedTo ? `${lead.assignedTo.slice(0, 8)}…` : t("common.unassigned")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.createdAt ? format.date(lead.createdAt) : "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/leads/${lead.id}`} aria-label={t("leads.viewNamed", { name: lead.fullName })}>
                      {t("common.view")}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      {data && (
        <AppPagination
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
