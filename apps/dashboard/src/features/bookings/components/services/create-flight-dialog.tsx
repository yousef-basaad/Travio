"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { CabinClass } from "../../types/booking";
import { useCreateFlight } from "../../api/bookings.api";
import { CABIN_CLASS_LABELS } from "./flight-item";

const CABIN_CLASS_OPTIONS: CabinClass[] = ["economy", "business", "first"];

export function isCabinClass(value: string): value is CabinClass {
  return (CABIN_CLASS_OPTIONS as readonly string[]).includes(value);
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

type CreateFlightDialogProps = {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics (showModal/close/backdrop/cancel-prevention) live in
// the shared Dialog primitive (packages/ui) - this only owns form state
// and field markup. Every field is genuinely optional (booking_flights
// has no NOT NULL constraint beyond tenant/booking id), so there's no
// required-field validation to run client-side.
export function CreateFlightDialog({ bookingId, open, onOpenChange }: CreateFlightDialogProps) {
  const createFlight = useCreateFlight();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      createFlight.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    createFlight.mutate(
      {
        bookingId,
        airline: form.airline.trim() || undefined,
        flightNumber: form.flightNumber.trim() || undefined,
        departureAirport: form.departureAirport.trim() || undefined,
        arrivalAirport: form.arrivalAirport.trim() || undefined,
        // datetime-local inputs yield "YYYY-MM-DDTHH:mm" (no timezone) -
        // converted to a full ISO string here, which is what the API's
        // zod schema (z.string().datetime()) and the timestamptz column
        // both expect.
        departureTime: form.departureTime
          ? new Date(form.departureTime).toISOString()
          : undefined,
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        cabinClass: form.cabinClass || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createFlight.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createFlight.isPending}
      aria-labelledby="create-flight-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-flight-title" className="text-lg font-semibold">
          Add Flight
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="flight-airline" className="text-sm font-medium">
              Airline
            </label>
            <input
              id="flight-airline"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.airline}
              onChange={(event) => setForm({ ...form, airline: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="flight-number" className="text-sm font-medium">
              Flight Number
            </label>
            <input
              id="flight-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.flightNumber}
              onChange={(event) => setForm({ ...form, flightNumber: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="flight-departure-airport" className="text-sm font-medium">
              Departure Airport
            </label>
            <input
              id="flight-departure-airport"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.departureAirport}
              onChange={(event) => setForm({ ...form, departureAirport: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="flight-arrival-airport" className="text-sm font-medium">
              Arrival Airport
            </label>
            <input
              id="flight-arrival-airport"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.arrivalAirport}
              onChange={(event) => setForm({ ...form, arrivalAirport: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="flight-departure-time" className="text-sm font-medium">
              Departure Time
            </label>
            <input
              id="flight-departure-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.departureTime}
              onChange={(event) => setForm({ ...form, departureTime: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="flight-arrival-time" className="text-sm font-medium">
              Arrival Time
            </label>
            <input
              id="flight-arrival-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.arrivalTime}
              onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="flight-cabin-class" className="text-sm font-medium">
            Cabin Class
          </label>
          <select
            id="flight-cabin-class"
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

        {createFlight.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the flight. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createFlight.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createFlight.isPending}>
            {createFlight.isPending ? "Adding…" : "Add Flight"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
