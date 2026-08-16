"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { BookingFlight, CabinClass } from "../../types/booking";
import { useUpdateFlight } from "../../api/bookings.api";
import { CABIN_CLASS_LABELS } from "./flight-item";
import { isCabinClass } from "./create-flight-dialog";

const CABIN_CLASS_OPTIONS: CabinClass[] = ["economy", "business", "first"];

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
  airline: "",
  flightNumber: "",
  departureAirport: "",
  arrivalAirport: "",
  departureTime: "",
  arrivalTime: "",
  cabinClass: "" as CabinClass | "",
};

function toFormValues(flight: BookingFlight): typeof EMPTY_FORM {
  return {
    airline: flight.airline ?? "",
    flightNumber: flight.flightNumber ?? "",
    departureAirport: flight.departureAirport ?? "",
    arrivalAirport: flight.arrivalAirport ?? "",
    departureTime: toDateTimeLocalValue(flight.departureTime),
    arrivalTime: toDateTimeLocalValue(flight.arrivalTime),
    cabinClass: flight.cabinClass ?? "",
  };
}

type EditFlightDialogProps = {
  flight: BookingFlight | null;
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. `flight` is only
// meaningfully non-null while `open` is true.
export function EditFlightDialog({ flight, bookingId, open, onOpenChange }: EditFlightDialogProps) {
  const updateFlight = useUpdateFlight();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open && flight) {
      setForm(toFormValues(flight));
      updateFlight.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flight]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!flight) return;

    // Full-state submit - clearing a field sends an explicit null so
    // bookingFlightsService's update mapper actually clears the column,
    // same reasoning as EditBookingDialog/EditLeadDialog.
    updateFlight.mutate(
      {
        id: flight.id,
        bookingId,
        airline: form.airline.trim() || null,
        flightNumber: form.flightNumber.trim() || null,
        departureAirport: form.departureAirport.trim() || null,
        arrivalAirport: form.arrivalAirport.trim() || null,
        departureTime: form.departureTime ? new Date(form.departureTime).toISOString() : null,
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : null,
        cabinClass: form.cabinClass || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateFlight.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateFlight.isPending}
      aria-labelledby="edit-flight-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-flight-title" className="text-lg font-semibold">
          Edit Flight
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="edit-flight-airline" className="text-sm font-medium">
              Airline
            </label>
            <input
              id="edit-flight-airline"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.airline}
              onChange={(event) => setForm({ ...form, airline: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-flight-number" className="text-sm font-medium">
              Flight Number
            </label>
            <input
              id="edit-flight-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.flightNumber}
              onChange={(event) => setForm({ ...form, flightNumber: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-flight-departure-airport" className="text-sm font-medium">
              Departure Airport
            </label>
            <input
              id="edit-flight-departure-airport"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.departureAirport}
              onChange={(event) => setForm({ ...form, departureAirport: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-flight-arrival-airport" className="text-sm font-medium">
              Arrival Airport
            </label>
            <input
              id="edit-flight-arrival-airport"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.arrivalAirport}
              onChange={(event) => setForm({ ...form, arrivalAirport: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-flight-departure-time" className="text-sm font-medium">
              Departure Time
            </label>
            <input
              id="edit-flight-departure-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.departureTime}
              onChange={(event) => setForm({ ...form, departureTime: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-flight-arrival-time" className="text-sm font-medium">
              Arrival Time
            </label>
            <input
              id="edit-flight-arrival-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.arrivalTime}
              onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-flight-cabin-class" className="text-sm font-medium">
            Cabin Class
          </label>
          <select
            id="edit-flight-cabin-class"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.cabinClass}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isCabinClass(value)) {
                setForm({ ...form, cabinClass: value as CabinClass | "" });
              }
            }}
          >
            <option value="">Select a cabin class</option>
            {CABIN_CLASS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {CABIN_CLASS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {updateFlight.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateFlight.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateFlight.isPending}>
            {updateFlight.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
