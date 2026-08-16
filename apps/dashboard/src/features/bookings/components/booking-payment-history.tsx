"use client";

import { Receipt } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@travio/utils";
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
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_STYLES,
} from "@/features/finance";

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
  const invoiceNumberById = new Map(invoices?.map((invoice) => [invoice.id, invoice.invoiceNumber]));

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">Payment History</h2>
      </CardHeader>
      <CardContent>
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && (!payments || payments.length === 0)}
          loadingLabel="Loading payments"
          errorMessage="Something went wrong loading payments. Please try again later."
          emptyMessage="No payments recorded yet"
          emptyIcon={<Receipt size={20} />}
        >
          <Table aria-label="Payment history" caption="Payments recorded against this booking's invoices">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>Date</TableCell>
                <TableCell header>Invoice</TableCell>
                <TableCell header>Method</TableCell>
                <TableCell header>Reference</TableCell>
                <TableCell header align="end">
                  Amount
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</TableCell>
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
                      {PAYMENT_METHOD_LABELS[payment.method]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.reference ?? "—"}</TableCell>
                  <TableCell align="end">{formatCurrency(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
      </CardContent>
    </Card>
  );
}
