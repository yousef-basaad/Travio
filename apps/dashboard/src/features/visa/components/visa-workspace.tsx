"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Stamp } from "lucide-react";
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
  Select,
} from "@travio/ui";
import { useSession } from "@travio/auth";
import type { UserRole } from "@travio/types";
import type { VisaApplicationWithCustomer, VisaStatus } from "@travio/api";
import {
  EditVisaDialog,
  VISA_STATUS_KEYS,
  VisaStatusBadge,
  useVisaApplications,
} from "@/features/customers";
import { filterVisaApplications, type VisaStatusFilter } from "../utils/filter-visas";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const COLUMNS: MessageKey[] = ["common.customer", "visa.country", "visa.visaType", "common.status", "visaCenter.submitted"];
const STATUS_OPTIONS: VisaStatus[] = ["draft", "submitted", "approved", "rejected"];

// Same list as CUSTOMERS_ROLES in lib/auth/require-domain-access.ts:
// only these roles can open Customer 360, so only they get a link.
const CUSTOMER_PAGE_ROLES: readonly UserRole[] = [
  "travio_admin",
  "agency_owner",
  "branch_manager",
  "sales_agent",
];

// The Visa Center: every visa application the caller may see (RLS
// decides which), searchable and filterable by status, each editable
// with the same dialog Customer 360 uses. New visas are still added
// from a customer's profile, where the customer is chosen.
export function VisaWorkspace() {
  const t = useT();
  const format = useFormat();
  const { profile } = useSession();
  const { data: visas, isLoading, isError } = useVisaApplications();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VisaStatusFilter>("all");
  const [editingVisa, setEditingVisa] = useState<VisaApplicationWithCustomer | null>(null);

  const canOpenCustomer = profile ? CUSTOMER_PAGE_ROLES.includes(profile.role) : false;
  const isFiltering = query.trim() !== "" || status !== "all";

  const filtered = useMemo(
    () => filterVisaApplications(visas ?? [], { query, status }),
    [visas, query, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.visa")}
        description={t("visaCenter.description")}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder={t("visaCenter.searchPlaceholder")}
          aria-label={t("visaCenter.searchLabel")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          containerClassName="sm:max-w-sm sm:flex-1"
        />
        <Select
          aria-label={t("visaCenter.filterLabel")}
          value={status}
          onChange={(event) => setStatus(event.target.value as VisaStatusFilter)}
          className="sm:w-48"
        >
          <option value="all">{t("visaCenter.allStatuses")}</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(VISA_STATUS_KEYS[option])}
            </option>
          ))}
        </Select>
      </div>

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && filtered.length === 0}
        loadingLabel={t("visa.loading")}
        errorMessage={t("visa.error")}
        emptyMessage={isFiltering ? t("visaCenter.noMatch") : t("visa.empty")}
        emptyAction={
          !isFiltering && canOpenCustomer ? (
            <Button asChild variant="outline">
              <Link href="/customers">{t("visaCenter.emptyHint")}</Link>
            </Button>
          ) : undefined
        }
        emptyIcon={<Stamp size={20} />}
        size="page"
      >
        <Table aria-label={t("visaCenter.tableLabel")} caption={t("visaCenter.tableCaption")}>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {t(column)}
                </TableCell>
              ))}
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((visa) => {
              const customerName = visa.customer?.fullName ?? t("visaCenter.unknownCustomer");
              return (
                <TableRow key={visa.id}>
                  <TableCell className="font-medium text-foreground">
                    {canOpenCustomer && visa.customer ? (
                      <Link href={`/customers/${visa.customer.id}`} className="hover:underline">
                        {customerName}
                      </Link>
                    ) : (
                      customerName
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{visa.country ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{visa.visaType ?? "—"}</TableCell>
                  <TableCell>{visa.status ? <VisaStatusBadge status={visa.status} /> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {visa.submittedAt ? format.date(visa.submittedAt) : "—"}
                  </TableCell>
                  <TableCell align="end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingVisa(visa)}
                      aria-label={t("visaCenter.editFor", { name: customerName })}
                    >
                      {t("common.edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataTableState>

      {editingVisa && (
        <EditVisaDialog
          visa={editingVisa}
          customerId={editingVisa.customerId}
          open={editingVisa !== null}
          onOpenChange={(open) => {
            if (!open) setEditingVisa(null);
          }}
        />
      )}
    </div>
  );
}
