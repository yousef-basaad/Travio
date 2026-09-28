"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@travio/ui";
import type { InvoiceItem } from "@travio/api";
import {
  useInvoiceItems,
  useDeleteInvoiceItem,
} from "../../api/invoices.api";
import { InvoiceItemRow } from "./invoice-item";
import { CreateInvoiceItemDialog } from "./create-invoice-item-dialog";
import { EditInvoiceItemDialog } from "./edit-invoice-item-dialog";

function ItemsSkeleton() {
  return (
    <div role="status" aria-label="Loading items" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function ItemsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading items. Please try again later.
    </div>
  );
}

type InvoiceItemsListProps = {
  invoiceId: string;
};

// Bare - no Card wrapper, unlike InvoiceList/FlightList/etc. This is
// nested inside invoice-item.tsx's own ServiceItemContent (the invoice
// row itself), which already provides the outer Card via ServiceItem.
export function InvoiceItemsList({ invoiceId }: InvoiceItemsListProps) {
  const { data: items, isLoading, isError } = useInvoiceItems(invoiceId);
  const deleteItem = useDeleteInvoiceItem();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);

  const hasItems = !isLoading && !isError && !!items && items.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Items</h3>
        <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <ItemsSkeleton />
      ) : isError ? (
        <ItemsErrorState />
      ) : !hasItems ? (
        <EmptyState icon={<ListChecks size={20} />} message="No items yet" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <InvoiceItemRow
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={(id) => deleteItem.mutate({ id, invoiceId })}
              isDeleting={deleteItem.isPending && deleteItem.variables?.id === item.id}
            />
          ))}
        </ul>
      )}

      <CreateInvoiceItemDialog
        invoiceId={invoiceId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditInvoiceItemDialog
        item={editingItem}
        invoiceId={invoiceId}
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
      />
    </div>
  );
}
