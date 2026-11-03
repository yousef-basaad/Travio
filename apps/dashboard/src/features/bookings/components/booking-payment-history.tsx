"use client";

import { Receipt } from "lucide-react";
import { cn } from "@travio/utils";
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
} from "@travio/ui";
import {
  useBookingPayments,
  useBookingInvoices,
  PAYMENT_METHOD_STYLES,
} from "@/features/finance";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { PaymentMethod } from "@travio/api";

const PAYMENT_METHOD_KEYS: Record<PaymentMethod, MessageKey> = {
  cash: "paymentMethod.cash",
  card: "paymentMethod.card",
  bank_transfer: "paymentMethod.bank_transfer",
  online: "paymentMethod.online",
};

// Reuses useBookingPayments (paymentService.listByBooking, Product-3) and
// the same useBookingInvoices BookingFinancialSummary already fetches
// (React Query dedupes the shared cache key, so mounting both in the
// same tab is not a second network request) purely to resolve each
// payment's invoiceId to a human-readable invoice number - no new
// aggregate beyond that lookup. Read-only: recording a payment still
// only happens from a specific invoice's own PaymentsList (in the
// Finance tab's InvoiceList below), matching how BookingFinancialSummary
// is also display-only.
export function BookingPaymentHistory({ bookingId }: { bookingId: string }) {
  const { data: payments, isLoading, isError } = useBookingPayments(bookingId);
  const { data: invoices } = useBookingInvoices(bookingId);
  const t = useT();
  const format = useFormat();
  const invoiceNumberById = new Map(invoices?.map((invoice) => [invoice.id, invoice.invoiceNumber]));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">{t("bookings.payments.title")}</h2>
      </CardHeader>
      <CardContent>
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && (!payments || payments.length === 0)}
          loadingLabel={t("bookings.payments.loading")}
          errorMessage={t("bookings.payments.error")}
          emptyMessage={t("bookings.payments.empty")}
          emptyIcon={<Receipt size={20} />}
        >
          <Table aria-label={t("bookings.payments.title")} caption={t("bookings.payments.caption")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("bookings.payments.date")}</TableCell>
                <TableCell header>{t("bookings.payments.invoice")}</TableCell>
                <TableCell header>{t("bookings.payments.method")}</TableCell>
                <TableCell header>{t("bookings.payments.reference")}</TableCell>
                <TableCell header align="end">
                  {t("bookingField.amount")}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paidAt ? format.date(payment.paidAt) : "—"}</TableCell>
                  <TableCell className="font-medium">
                    {invoiceNumberById.get(payment.invoiceId) ?? "—"}
                  </TableCell>
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
                  <TableCell className="text-muted-foreground">{payment.reference ?? "—"}</TableCell>
                  <TableCell align="end">{format.currency(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
      </CardContent>
    </Card>
  );
}
