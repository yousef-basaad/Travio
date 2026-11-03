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
  Pagination,
} from "@travio/ui";
import { cn, formatCurrency, formatDate } from "@travio/utils";
import { useInvoicesPage } from "../api/invoices.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { FINANCE_CARD_PAGE_SIZE } from "./finance-paging";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from "./invoice-item";

// Tenant-wide invoice list - the Finance workspace's counterpart to the
// existing customer/booking-scoped InvoiceList (which stays untouched;
// this is a new, separate component, not a replacement). Reuses
// INVOICE_STATUS_LABELS/STYLES from invoice-item.tsx instead of a second
// status-color map. Paged and searched on the server (each row carries
// its customer's name), so it isn't capped at the 1000 rows one response
// can hold and doesn't need every customer loaded.
export function InvoiceTable() {
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(undefined, FINANCE_CARD_PAGE_SIZE);
  const { data, isLoading, isError, isFetching } = useInvoicesPage({ page, pageSize, search: debouncedSearch });
  const invoices = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
        <p className="text-xs text-muted-foreground">All invoices across your agency</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SearchInput
          placeholder="Search by invoice number"
          aria-label="Search invoices"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && invoices.length === 0}
          loadingLabel="Loading invoices"
          errorMessage="Something went wrong loading invoices. Please try again later."
          emptyMessage={debouncedSearch ? "No invoices match your search" : "No invoices yet"}
          emptyIcon={<FileText size={20} />}
        >
          <Table aria-label="Invoices" caption="All invoices across the tenant">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>Invoice</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Issued</TableCell>
                <TableCell header>Due</TableCell>
                <TableCell header>Total</TableCell>
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
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </span>
                  </TableCell>
                  <TableCell>{invoice.issueDate ? formatDate(invoice.issueDate) : "—"}</TableCell>
                  <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</TableCell>
                  <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
        {data && (
          <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
        )}
      </CardContent>
      <div className="border-t px-6 py-3 text-xs text-muted-foreground">
        Manage individual invoices from a customer&apos;s or booking&apos;s own Invoices tab.{" "}
        <Link href="/customers" className="underline hover:text-foreground">
          Go to Customers
        </Link>
      </div>
    </Card>
  );
}
