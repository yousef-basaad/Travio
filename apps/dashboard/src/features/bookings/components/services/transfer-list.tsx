"use client";

import { useState } from "react";
import { Car } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { BookingTransfer } from "../../types/booking";
import { useBookingTransfers, useDeleteTransfer } from "../../api/bookings.api";
import { TransferItem } from "./transfer-item";
import { CreateTransferDialog } from "./create-transfer-dialog";
import { EditTransferDialog } from "./edit-transfer-dialog";

function TransfersSkeleton() {
  return (
    <div role="status" aria-label="Loading transfers" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function TransfersErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading transfers. Please try again later.
    </div>
  );
}

// Mirrors HotelList's shape - a Card with its own header/add action,
// rendered inside BookingTabs' Services tab alongside FlightList/
// HotelList. Uses the shared EmptyState (packages/ui), so the header's
// "Add Transfer" button is always visible rather than only appearing
// once transfers exist.
export function TransferList({ bookingId }: { bookingId: string }) {
  const { data: transfers, isLoading, isError } = useBookingTransfers(bookingId);
  const deleteTransfer = useDeleteTransfer();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<BookingTransfer | null>(null);

  const hasTransfers = !isLoading && !isError && !!transfers && transfers.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Transfers</h2>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Transfer
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TransfersSkeleton />
        ) : isError ? (
          <TransfersErrorState />
        ) : !hasTransfers ? (
          <EmptyState icon={<Car size={20} />} message="No transfers added yet" />
        ) : (
          <ul className="space-y-2">
            {transfers.map((transfer) => (
              <TransferItem
                key={transfer.id}
                transfer={transfer}
                onEdit={setEditingTransfer}
                onDelete={(id) => deleteTransfer.mutate({ id, bookingId })}
                isDeleting={deleteTransfer.isPending && deleteTransfer.variables?.id === transfer.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateTransferDialog
        bookingId={bookingId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditTransferDialog
        transfer={editingTransfer}
        bookingId={bookingId}
        open={editingTransfer !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTransfer(null);
        }}
      />
    </Card>
  );
}
