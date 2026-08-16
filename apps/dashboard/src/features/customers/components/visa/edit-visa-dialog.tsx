"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@travio/ui";
import type { VisaApplication, VisaStatus } from "@travio/api";
import { useUpdateVisa, useCustomerBookings } from "../../api/customers.api";
import { VISA_STATUS_LABELS } from "./visa-item";
import { isVisaStatus } from "./create-visa-dialog";

const VISA_STATUS_OPTIONS: VisaStatus[] = ["draft", "submitted", "approved", "rejected"];

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time - built from the
// Date object's own local getters (not toISOString(), which is UTC) so
// the value shown matches what the user would expect to see/edit.
function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const EMPTY_FORM = {
  bookingId: "",
  country: "",
  visaType: "",
  status: "" as VisaStatus | "",
  submittedAt: "",
  assignedTo: "",
};

function toFormValues(visa: VisaApplication): typeof EMPTY_FORM {
  return {
    bookingId: visa.bookingId ?? "",
    country: visa.country ?? "",
    visaType: visa.visaType ?? "",
    status: visa.status ?? "",
    submittedAt: toDateTimeLocalValue(visa.submittedAt),
    assignedTo: visa.assignedTo ?? "",
  };
}

type EditVisaDialogProps = {
  visa: VisaApplication | null;
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. `visa` is only
// meaningfully non-null while `open` is true. The "Booking" field
// (mirrors CreateVisaDialog's) lets an agent retroactively link/relink/
// unlink an existing visa to one of this customer's bookings.
export function EditVisaDialog({ visa, customerId, open, onOpenChange }: EditVisaDialogProps) {
  const updateVisa = useUpdateVisa();
  const { data: bookings } = useCustomerBookings(customerId);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open && visa) {
      setForm(toFormValues(visa));
      updateVisa.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visa]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!visa) return;

    // Full-state submit - clearing a field sends an explicit null so
    // visaApplicationsService's update mapper actually clears the
    // column, same reasoning as EditFlightDialog/EditHotelDialog.
    // status has no "unset" - omitted means leave unchanged, same as
    // updateBookingSchema's status.
    updateVisa.mutate(
      {
        id: visa.id,
        customerId,
        bookingId: form.bookingId || null,
        country: form.country.trim() || null,
        visaType: form.visaType.trim() || null,
        status: form.status || undefined,
        submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : null,
        assignedTo: form.assignedTo.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateVisa.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateVisa.isPending}
      aria-labelledby="edit-visa-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-visa-title" className="text-lg font-semibold">
          Edit Visa Application
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Country" htmlFor="edit-visa-country">
            <Input
              id="edit-visa-country"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </FormField>

          <FormField label="Visa Type" htmlFor="edit-visa-type">
            <Input
              id="edit-visa-type"
              value={form.visaType}
              onChange={(event) => setForm({ ...form, visaType: event.target.value })}
            />
          </FormField>

          <FormField label="Submitted At" htmlFor="edit-visa-submitted-at">
            <Input
              id="edit-visa-submitted-at"
              type="datetime-local"
              value={form.submittedAt}
              onChange={(event) => setForm({ ...form, submittedAt: event.target.value })}
            />
          </FormField>

          <FormField label="Booking" htmlFor="edit-visa-booking">
            <Select
              id="edit-visa-booking"
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

        <FormField label="Status" htmlFor="edit-visa-status">
          <Select
            id="edit-visa-status"
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

        {/* Raw id, not a user-picker - same convention as EditLeadDialog's/
            EditBookingDialog's assignedTo field (no profiles join/picker
            exists yet). */}
        <FormField label="Assigned To" htmlFor="edit-visa-assigned-to">
          <Input
            id="edit-visa-assigned-to"
            placeholder="Unassigned"
            value={form.assignedTo}
            onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}
          />
        </FormField>

        {updateVisa.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateVisa.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateVisa.isPending}>
            {updateVisa.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
