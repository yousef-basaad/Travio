"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input, Select, Textarea } from "@travio/ui";
import { useCustomers } from "@/features/customers";
import type { Booking } from "../types/booking";
import { useUpdateBooking } from "../api/bookings.api";
import {
  updateBookingFormSchema,
  type UpdateBookingFormValues,
} from "../schemas/update-booking.schema";

type EditBookingDialogProps = {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(booking: Booking): UpdateBookingFormValues {
  return {
    customerId: booking.customerId,
    title: booking.title,
    startDate: booking.startDate ?? "",
    endDate: booking.endDate ?? "",
    notes: booking.notes ?? "",
    assignedTo: booking.assignedTo ?? "",
  };
}

// Mirrors EditLeadDialog's native <dialog> pattern (see that file's
// comment for why: no dialog primitive exists anywhere in the project,
// and this issue's scope is apps/dashboard only).
export function EditBookingDialog({ booking, open, onOpenChange }: EditBookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const updateBooking = useUpdateBooking();
  // Reuses the customers feature's own query - never a second/duplicate
  // customer fetch, same as CreateBookingForm.
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateBookingFormValues>({
    resolver: zodResolver(updateBookingFormSchema),
    defaultValues: toFormValues(booking),
  });

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      setSubmitError(null);
      reset(toFormValues(booking));
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // Only re-run when the dialog is asked to open/close - reset() already
    // re-reads the latest `booking` at that moment via the closure below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await updateBooking.mutateAsync({ id: booking.id, input: values });
      onOpenChange(false);
    } catch {
      // Keep the dialog open and the entered values intact (reset() is
      // only called on success, same as EditLeadDialog).
      setSubmitError("Couldn't save changes. Please try again.");
    }
  });

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      aria-labelledby="edit-booking-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={onSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-booking-title" className="text-lg font-semibold">
          Edit Booking
        </h2>

        <FormField label="Customer" htmlFor="edit-booking-customer" error={errors.customerId?.message}>
          <Select
            id="edit-booking-customer"
            aria-invalid={errors.customerId ? "true" : "false"}
            aria-describedby={errors.customerId ? "edit-booking-customer-error" : undefined}
            disabled={isLoadingCustomers}
            {...register("customerId")}
          >
            <option value="">
              {isLoadingCustomers ? "Loading customers…" : "Select a customer"}
            </option>
            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="edit-booking-title-input" error={errors.title?.message}>
          <Input
            id="edit-booking-title-input"
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "edit-booking-title-input-error" : undefined}
            {...register("title")}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Start Date" htmlFor="edit-booking-start-date" error={errors.startDate?.message}>
            <Input
              id="edit-booking-start-date"
              type="date"
              aria-invalid={errors.startDate ? "true" : "false"}
              aria-describedby={errors.startDate ? "edit-booking-start-date-error" : undefined}
              {...register("startDate")}
            />
          </FormField>

          <FormField label="End Date" htmlFor="edit-booking-end-date" error={errors.endDate?.message}>
            <Input
              id="edit-booking-end-date"
              type="date"
              aria-invalid={errors.endDate ? "true" : "false"}
              aria-describedby={errors.endDate ? "edit-booking-end-date-error" : undefined}
              {...register("endDate")}
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="edit-booking-notes">
          <Textarea id="edit-booking-notes" rows={4} {...register("notes")} />
        </FormField>

        {/* Raw id, not a user-picker - same convention as EditLeadDialog's
            assignedTo field (no profiles join/picker exists yet). */}
        <FormField
          label="Assigned To"
          htmlFor="edit-booking-assigned-to"
          error={errors.assignedTo?.message}
        >
          <Input
            id="edit-booking-assigned-to"
            placeholder="Unassigned"
            aria-invalid={errors.assignedTo ? "true" : "false"}
            aria-describedby={errors.assignedTo ? "edit-booking-assigned-to-error" : undefined}
            {...register("assignedTo")}
          />
        </FormField>

        {submitError && (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
