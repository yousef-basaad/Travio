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
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { cn } from "@travio/utils";
import { usePaymentsPage } from "../api/invoices.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { FINANCE_CARD_PAGE_SIZE } from "./finance-paging";
import { PAYMENT_METHOD_KEYS, PAYMENT_METHOD_STYLES } from "./payments/payment-item";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Tenant-wide payment list - the Finance workspace's counterpart to the
// existing per-invoice PaymentsList (which stays untouched; this is a
// new, separate component). Reuses PAYMENT_METHOD_KEYS/STYLES from
// payment-item.tsx instead of a second method-color map. Paged and
// searched (by reference) on the server; each row carries its invoice
// number, so every invoice doesn't have to be loaded to label it.
export function PaymentStatus() {
  const t = useT();
  const format = useFormat();
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(undefined, FINANCE_CARD_PAGE_SIZE);
  const { data, isLoading, isError, isFetching } = usePaymentsPage({ page, pageSize, search: debouncedSearch });
  const payments = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("finance.payments.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("finance.payments.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SearchInput
          placeholder={t("finance.payments.searchPlaceholder")}
          aria-label={t("finance.payments.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && payments.length === 0}
          loadingLabel={t("bookings.payments.loading")}
          errorMessage={t("bookings.payments.error")}
          emptyMessage={debouncedSearch ? t("finance.payments.emptySearch") : t("finance.payments.empty")}
          emptyIcon={<Receipt size={20} />}
        >
          <Table aria-label={t("finance.payments.title")} caption={t("finance.payments.caption")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("bookings.payments.invoice")}</TableCell>
                <TableCell header>{t("bookingField.amount")}</TableCell>
                <TableCell header>{t("bookings.payments.method")}</TableCell>
                <TableCell header>{t("bookings.payments.reference")}</TableCell>
                <TableCell header>{t("bookings.finance.paid")}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.invoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell>{format.currency(payment.amount)}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        PAYMENT_METHOD_STYLES[payment.method],
                      )}
                    >
                      {t(PAYMENT_METHOD_KEYS[payment.method])}
                    </span>
                  </TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell>{payment.paidAt ? format.date(payment.paidAt) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
        {data && (
          <AppPagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
        )}
      </CardContent>
    </Card>
  );
}
