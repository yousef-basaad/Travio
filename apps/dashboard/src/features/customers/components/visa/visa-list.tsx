"use client";

import { useState } from "react";
import Link from "next/link";
import { Stamp } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { VisaApplication } from "@travio/api";
import { useCustomerVisas, useBookingVisas, useDeleteVisa } from "../../api/customers.api";
import { VisaItem } from "./visa-item";
import { CreateVisaDialog } from "./create-visa-dialog";
import { EditVisaDialog } from "./edit-visa-dialog";

function VisasSkeleton() {
  return (
    <div role="status" aria-label="Loading visa applications" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function VisasErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading visa applications. Please try again later.
    </div>
  );
}

type VisaListProps = {
  customerId?: string;
  bookingId?: string;
};

// Mirrors HotelList/TransferList's shape - a Card with its own header/add
// action. Works in two contexts (Customer 360 or Booking 360), same
// dual-prop convention as InvoiceList - the caller passes exactly one of
// customerId/bookingId. Both queries are called unconditionally (React
// hooks rules), but only the one with a truthy id is enabled/actually
// fetches.
//
// Booking 360's view is read-only: visa applications are still only ever
// created/edited/deleted from the Customer 360 tab (create/edit already
// let an agent link a visa to one of that customer's bookings via the
// "Booking" field) - this just makes an already-linked visa visible from
// the booking it's for too, with a link back to the owning customer
// rather than a second edit/delete surface for the same row.
export function VisaList({ customerId, bookingId }: VisaListProps) {
  const customerVisas = useCustomerVisas(customerId ?? "");
  const bookingVisas = useBookingVisas(bookingId ?? "");
  const { data: visas, isLoading, isError } = customerId ? customerVisas : bookingVisas;

  const deleteVisa = useDeleteVisa();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaApplication | null>(null);
  const readOnly = !customerId;

  const hasVisas = !isLoading && !isError && !!visas && visas.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Visa Applications</h2>
        {!readOnly && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Add Visa Application
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <VisasSkeleton />
        ) : isError ? (
          <VisasErrorState />
        ) : !hasVisas ? (
          <EmptyState icon={<Stamp size={20} />} message="No visa applications yet" />
        ) : (
          <ul className="space-y-2">
            {visas.map((visa) => (
              <VisaItem
                key={visa.id}
                visa={visa}
                onEdit={readOnly ? undefined : setEditingVisa}
                onDelete={
                  readOnly ? undefined : (id) => deleteVisa.mutate({ id, customerId: customerId! })
                }
                isDeleting={deleteVisa.isPending && deleteVisa.variables?.id === visa.id}
              />
            ))}
          </ul>
        )}

        {readOnly && hasVisas && (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Manage visa applications from{" "}
            <Link href={`/customers/${visas![0]!.customerId}`} className="underline hover:text-foreground">
              the customer&apos;s profile
            </Link>
            .
          </p>
        )}
      </CardContent>

      {!readOnly && (
        <>
          <CreateVisaDialog customerId={customerId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          <EditVisaDialog
            visa={editingVisa}
            customerId={customerId}
            open={editingVisa !== null}
            onOpenChange={(open) => {
              if (!open) setEditingVisa(null);
            }}
          />
        </>
      )}
    </Card>
  );
}
