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
import { useI18n } from "@/lib/i18n/i18n-provider";
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
  const { t, format } = useI18n();
  const [viewingPayments, setViewingPayments] = useState<Invoice | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title={t("finance.title")} description={t("finance.description")} />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!invoices || invoices.length === 0)}
        loadingLabel={t("finance.loading")}
        errorMessage={t("finance.error")}
        emptyMessage={t("finance.empty")}
        emptyIcon={<Receipt size={20} />}
        size="page"
      >
        <Table aria-label={t("finance.tableLabel")} caption={t("finance.caption")}>
          <TableHeader>
            <TableRow>
              <TableCell header>{t("finance.col.invoice")}</TableCell>
              <TableCell header>{t("finance.col.status")}</TableCell>
              <TableCell header>{t("finance.col.issued")}</TableCell>
              <TableCell header>{t("finance.col.due")}</TableCell>
              <TableCell header>{t("finance.col.total")}</TableCell>
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
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
                  {invoice.issueDate ? format.date(invoice.issueDate) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.dueDate ? format.date(invoice.dueDate) : "—"}
                </TableCell>
                <TableCell>{format.currency(invoice.total, invoice.currency)}</TableCell>
                <TableCell align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingPayments(invoice)}
                    aria-label={t("finance.viewPaymentsFor", { number: invoice.invoiceNumber })}
                  >
                    {t("finance.viewPayments")}
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
