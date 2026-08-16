"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@travio/ui";
import type { VisaStatus } from "@travio/api";
import { useCreateVisa, useCustomerBookings } from "../../api/customers.api";
import { VISA_STATUS_LABELS } from "./visa-item";

const VISA_STATUS_OPTIONS: VisaStatus[] = ["draft", "submitted", "approved", "rejected"];

export function isVisaStatus(value: string): value is VisaStatus {
  return (VISA_STATUS_OPTIONS as readonly string[]).includes(value);
}

const EMPTY_FORM = {
  bookingId: "",
  country: "",
  visaType: "",
  status: "" as VisaStatus | "",
  submittedAt: "",
};

type CreateVisaDialogProps = {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics (showModal/close/backdrop/cancel-prevention) live in
// the shared Dialog primitive (packages/ui) - this only owns form state
// and field markup. Every field is genuinely optional (visa_applications
// has no NOT NULL constraint beyond tenant/customer id), so there's no
// required-field validation to run client-side. The optional "Booking"
// field reuses useCustomerBookings (already fetched by CustomerOverviewTab/
// the Bookings tab, no new endpoint) - left unset ("No specific booking")
// by default, same as before this field existed; picking one is what
// makes the visa show up in that booking's own Booking 360 view
// (VisaList's bookingId mode).
export function CreateVisaDialog({ customerId, open, onOpenChange }: CreateVisaDialogProps) {
  const createVisa = useCreateVisa();
  const { data: bookings } = useCustomerBookings(customerId);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      createVisa.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    createVisa.mutate(
      {
        customerId,
        bookingId: form.bookingId || undefined,
        country: form.country.trim() || undefined,
        visaType: form.visaType.trim() || undefined,
        status: form.status || undefined,
        // datetime-local inputs yield "YYYY-MM-DDTHH:mm" (no timezone) -
        // converted to a full ISO string here, which is what the API's
        // zod schema (z.string().datetime()) and the timestamptz column
        // both expect.
        submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createVisa.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createVisa.isPending}
      aria-labelledby="create-visa-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-visa-title" className="text-lg font-semibold">
          Add Visa Application
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Country" htmlFor="visa-country">
            <Input
              id="visa-country"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </FormField>

          <FormField label="Visa Type" htmlFor="visa-type">
            <Input
              id="visa-type"
              value={form.visaType}
              onChange={(event) => setForm({ ...form, visaType: event.target.value })}
            />
          </FormField>

          <FormField label="Submitted At" htmlFor="visa-submitted-at">
            <Input
              id="visa-submitted-at"
              type="datetime-local"
              value={form.submittedAt}
              onChange={(event) => setForm({ ...form, submittedAt: event.target.value })}
            />
          </FormField>

          <FormField label="Booking" htmlFor="visa-booking">
            <Select
              id="visa-booking"
              value={form.bookingId}
              onChange={(event) => setForm({ ...form, bookingId: event.target.value })}
            >
              <option value="">No specific booking</option>
              {bookings?.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.bookingNumber} · {booking.title}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Status" htmlFor="visa-status">
          <Select
            id="visa-status"
            value={form.status}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isVisaStatus(value)) {
                setForm({ ...form, status: value as VisaStatus | "" });
              }
            }}
          >
            <option value="">Select a status</option>
            {VISA_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {VISA_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
        </FormField>

        {createVisa.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the visa application. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createVisa.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createVisa.isPending}>
            {createVisa.isPending ? "Adding…" : "Add Visa Application"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
