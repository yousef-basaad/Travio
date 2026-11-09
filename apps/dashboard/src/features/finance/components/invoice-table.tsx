"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SearchInput,
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { cn } from "@travio/utils";
import { useInvoicesPage } from "../api/invoices.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { FINANCE_CARD_PAGE_SIZE } from "./finance-paging";
import { INVOICE_STATUS_KEYS, INVOICE_STATUS_STYLES } from "./invoice-item";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Tenant-wide invoice list - the Finance workspace's counterpart to the
// existing customer/booking-scoped InvoiceList (which stays untouched;
// this is a new, separate component, not a replacement). Reuses
// INVOICE_STATUS_KEYS/STYLES from invoice-item.tsx instead of a second
// status-color map. Paged and searched on the server (each row carries
// its customer's name), so it isn't capped at the 1000 rows one response
// can hold and doesn't need every customer loaded.
export function InvoiceTable() {
  const t = useT();
  const format = useFormat();
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(undefined, FINANCE_CARD_PAGE_SIZE);
  const { data, isLoading, isError, isFetching } = useInvoicesPage({ page, pageSize, search: debouncedSearch });
  const invoices = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("finance.invoices.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("finance.invoices.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SearchInput
          placeholder={t("finance.invoices.searchPlaceholder")}
          aria-label={t("finance.invoices.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && invoices.length === 0}
          loadingLabel={t("finance.invoices.loading")}
          errorMessage={t("finance.invoices.error")}
          emptyMessage={debouncedSearch ? t("finance.invoices.emptySearch") : t("finance.invoices.empty")}
          emptyIcon={<FileText size={20} />}
        >
          <Table aria-label={t("finance.invoices.title")} caption={t("finance.invoices.caption")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("bookings.payments.invoice")}</TableCell>
                <TableCell header>{t("common.customer")}</TableCell>
                <TableCell header>{t("common.status")}</TableCell>
                <TableCell header>{t("finance.invoices.issued")}</TableCell>
                <TableCell header>{t("finance.invoices.due")}</TableCell>
                <TableCell header>{t("finance.invoices.total")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        INVOICE_STATUS_STYLES[invoice.status],
                      )}
                    >
                      {t(INVOICE_STATUS_KEYS[invoice.status])}
                    </span>
                  </TableCell>
                  <TableCell>{invoice.issueDate ? format.date(invoice.issueDate) : "—"}</TableCell>
                  <TableCell>{invoice.dueDate ? format.date(invoice.dueDate) : "—"}</TableCell>
                  <TableCell>{format.currency(invoice.total, invoice.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
        {data && (
          <AppPagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
        )}
      </CardContent>
      <div className="border-t px-6 py-3 text-xs text-muted-foreground">
        {t("finance.invoices.manageHint")}{" "}
        <Link href="/customers" className="underline hover:text-foreground">
          {t("finance.invoices.goToCustomers")}
        </Link>
      </div>
    </Card>
  );
}
