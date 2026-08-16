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
} from "@travio/ui";
import { cn, formatCurrency, formatDate } from "@travio/utils";
import { useInvoices, usePayments } from "../api/invoices.api";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_STYLES } from "./payments/payment-item";

// Tenant-wide payment list - the Finance workspace's counterpart to the
// existing per-invoice PaymentsList (which stays untouched; this is a
// new, separate component). Reuses PAYMENT_METHOD_LABELS/STYLES from
// payment-item.tsx instead of a second method-color map.
export function PaymentStatus() {
  const { data: payments, isLoading, isError } = usePayments();
  const { data: invoices } = useInvoices();
  const invoiceNumberById = new Map(invoices?.map((invoice) => [invoice.id, invoice.invoiceNumber]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Payments</h2>
        <p className="text-xs text-muted-foreground">Recent payments across your agency</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!payments || payments.length === 0}
          loadingLabel="Loading payments"
          errorMessage="Something went wrong loading payments. Please try again later."
          emptyMessage="No payments yet"
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
              {(payments ?? []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {invoiceNumberById.get(payment.invoiceId) ?? "—"}
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
      </CardContent>
    </Card>
  );
}
