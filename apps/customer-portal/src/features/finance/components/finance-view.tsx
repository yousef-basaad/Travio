"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import {
  Button,
  DataTableState,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { formatCurrency, formatDate } from "@travio/utils";
import type { Invoice } from "@travio/api";
import { useInvoices } from "../api/finance.api";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoicePaymentsDialog } from "./invoice-payments-dialog";

// Read-only financial visibility: invoice number/status/amount, plus a
// per-invoice payment ledger (the only safe customer-scoped payments
// path - payments has no customer_id of its own, see
// payments_customer_access, Product-6 migration). No payment actions,
// no online payment anywhere on this page.
export function FinanceView() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const [viewingPayments, setViewingPayments] = useState<Invoice | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title="Finance" description="Invoices and payments for your bookings" />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!invoices || invoices.length === 0)}
        loadingLabel="Loading your invoices"
        errorMessage="Something went wrong loading your invoices. Please try again later."
        emptyMessage="No invoices yet"
        emptyIcon={<Receipt size={20} />}
        size="page"
      >
        <Table aria-label="Invoices" caption="Invoices issued to you">
          <TableHeader>
            <TableRow>
              <TableCell header>Invoice</TableCell>
              <TableCell header>Status</TableCell>
              <TableCell header>Issued</TableCell>
              <TableCell header>Due</TableCell>
              <TableCell header>Total</TableCell>
              <TableCell header>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(invoices ?? []).map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </TableCell>
                <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                <TableCell align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingPayments(invoice)}
                    aria-label={`View payments for ${invoice.invoiceNumber}`}
                  >
                    View Payments
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      <InvoicePaymentsDialog
        invoice={viewingPayments}
        open={viewingPayments !== null}
        onOpenChange={(open) => {
          if (!open) setViewingPayments(null);
        }}
      />
    </div>
  );
}
