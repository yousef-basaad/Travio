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
} from "@travio/ui";
import { cn, formatCurrency, formatDate } from "@travio/utils";
import { useCustomers } from "@/features/customers";
import { useInvoices } from "../api/invoices.api";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from "./invoice-item";

// Tenant-wide invoice list - the Finance workspace's counterpart to the
// existing customer/booking-scoped InvoiceList (which stays untouched;
// this is a new, separate component, not a replacement). Reuses
// INVOICE_STATUS_LABELS/STYLES from invoice-item.tsx instead of a second
// status-color map.
export function InvoiceTable() {
  const { data: invoices, isLoading, isError } = useInvoices();
  const { data: customers } = useCustomers();
  const customerNameById = new Map(customers?.map((customer) => [customer.id, customer.fullName]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
        <p className="text-xs text-muted-foreground">All invoices across your agency</p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!invoices || invoices.length === 0}
          loadingLabel="Loading invoices"
          errorMessage="Something went wrong loading invoices. Please try again later."
          emptyMessage="No invoices yet"
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
              {(invoices ?? []).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    {invoice.customerId
                      ? (customerNameById.get(invoice.customerId) ?? "—")
                      : "—"}
                  </TableCell>
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
