"use client";

import { Receipt } from "lucide-react";
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
import { usePaymentsPage } from "../api/invoices.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { FINANCE_CARD_PAGE_SIZE } from "./finance-paging";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_STYLES } from "./payments/payment-item";

// Tenant-wide payment list - the Finance workspace's counterpart to the
// existing per-invoice PaymentsList (which stays untouched; this is a
// new, separate component). Reuses PAYMENT_METHOD_LABELS/STYLES from
// payment-item.tsx instead of a second method-color map. Paged and
// searched (by reference) on the server; each row carries its invoice
// number, so every invoice doesn't have to be loaded to label it.
export function PaymentStatus() {
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(undefined, FINANCE_CARD_PAGE_SIZE);
  const { data, isLoading, isError, isFetching } = usePaymentsPage({ page, pageSize, search: debouncedSearch });
  const payments = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Payments</h2>
        <p className="text-xs text-muted-foreground">Recent payments across your agency</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SearchInput
          placeholder="Search by reference"
          aria-label="Search payments"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && payments.length === 0}
          loadingLabel="Loading payments"
          errorMessage="Something went wrong loading payments. Please try again later."
          emptyMessage={debouncedSearch ? "No payments match your search" : "No payments yet"}
          emptyIcon={<Receipt size={20} />}
        >
          <Table aria-label="Payments" caption="All payments across the tenant, most recent first">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>Invoice</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Method</TableCell>
                <TableCell header>Reference</TableCell>
                <TableCell header>Paid</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.invoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        PAYMENT_METHOD_STYLES[payment.method],
                      )}
                    >
                      {PAYMENT_METHOD_LABELS[payment.method]}
                    </span>
                  </TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
        {data && (
          <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
        )}
      </CardContent>
    </Card>
  );
}
