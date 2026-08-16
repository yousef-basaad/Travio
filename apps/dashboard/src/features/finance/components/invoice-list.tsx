"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { Invoice } from "@travio/api";
import { useCustomerInvoices, useBookingInvoices, useDeleteInvoice } from "../api/invoices.api";
import { InvoiceItem } from "./invoice-item";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { EditInvoiceDialog } from "./edit-invoice-dialog";

function InvoicesSkeleton() {
  return (
    <div role="status" aria-label="Loading invoices" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function InvoicesErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading invoices. Please try again later.
    </div>
  );
}

type InvoiceListProps = {
  customerId?: string;
  bookingId?: string;
};

// Mirrors HotelList/TransferList/VisaList's shape - a Card with its own
// header/add action. Works in two contexts (Customer 360 or Booking
// Details) - the caller passes exactly one of customerId/bookingId. Both
// queries are called unconditionally (React hooks rules), but only the
// one with a truthy id is enabled/actually fetches.
export function InvoiceList({ customerId, bookingId }: InvoiceListProps) {
  const customerInvoices = useCustomerInvoices(customerId ?? "");
  const bookingInvoices = useBookingInvoices(bookingId ?? "");
  const {
    data: invoices,
    isLoading,
    isError,
  } = customerId ? customerInvoices : bookingInvoices;

  const deleteInvoice = useDeleteInvoice();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const hasInvoices = !isLoading && !isError && !!invoices && invoices.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Invoices</h2>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Invoice
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <InvoicesSkeleton />
        ) : isError ? (
          <InvoicesErrorState />
        ) : !hasInvoices ? (
          <EmptyState icon={<FileText size={20} />} message="No invoices yet" />
        ) : (
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <InvoiceItem
                key={invoice.id}
                invoice={invoice}
                onEdit={setEditingInvoice}
                onDelete={(id) => deleteInvoice.mutate({ id, customerId, bookingId })}
                isDeleting={deleteInvoice.isPending && deleteInvoice.variables?.id === invoice.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateInvoiceDialog
        customerId={customerId}
        bookingId={bookingId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditInvoiceDialog
        invoice={editingInvoice}
        customerId={customerId}
        bookingId={bookingId}
        open={editingInvoice !== null}
        onOpenChange={(open) => {
          if (!open) setEditingInvoice(null);
        }}
      />
    </Card>
  );
}
