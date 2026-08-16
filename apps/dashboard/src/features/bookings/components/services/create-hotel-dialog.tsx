"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { BoardType } from "../../types/booking";
import { useCreateHotel } from "../../api/bookings.api";
import { BOARD_TYPE_LABELS } from "./hotel-item";

const BOARD_TYPE_OPTIONS: BoardType[] = [
  "room_only",
  "bed_breakfast",
  "half_board",
  "full_board",
  "all_inclusive",
];

export function isBoardType(value: string): value is BoardType {
  return (BOARD_TYPE_OPTIONS as readonly string[]).includes(value);
}

const EMPTY_FORM = {
  hotelName: "",
  city: "",
  country: "",
  checkIn: "",
  checkOut: "",
  rooms: "",
  roomType: "",
  boardType: "" as BoardType | "",
  confirmationNumber: "",
};

type CreateHotelDialogProps = {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics (showModal/close/backdrop/cancel-prevention) live in
// the shared Dialog primitive (packages/ui) - this only owns form state
// and field markup. Every field is genuinely optional (booking_hotels
// has no NOT NULL constraint beyond tenant/booking id), so there's no
// required-field validation to run client-side.
export function CreateHotelDialog({ bookingId, open, onOpenChange }: CreateHotelDialogProps) {
  const createHotel = useCreateHotel();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      createHotel.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedRooms = form.rooms.trim();
    const parsedRooms = trimmedRooms === "" ? undefined : Number(trimmedRooms);

    createHotel.mutate(
      {
        bookingId,
        hotelName: form.hotelName.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        // datetime-local inputs yield "YYYY-MM-DDTHH:mm" (no timezone) -
        // converted to a full ISO string here, which is what the API's
        // zod schema (z.string().datetime()) and the timestamptz column
        // both expect.
        checkIn: form.checkIn ? new Date(form.checkIn).toISOString() : undefined,
        checkOut: form.checkOut ? new Date(form.checkOut).toISOString() : undefined,
        rooms: parsedRooms !== undefined && Number.isFinite(parsedRooms) ? parsedRooms : undefined,
        roomType: form.roomType.trim() || undefined,
        boardType: form.boardType || undefined,
        confirmationNumber: form.confirmationNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createHotel.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createHotel.isPending}
      aria-labelledby="create-hotel-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-hotel-title" className="text-lg font-semibold">
          Add Hotel
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="hotel-name" className="text-sm font-medium">
              Hotel Name
            </label>
            <input
              id="hotel-name"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.hotelName}
              onChange={(event) => setForm({ ...form, hotelName: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-city" className="text-sm font-medium">
              City
            </label>
            <input
              id="hotel-city"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-country" className="text-sm font-medium">
              Country
            </label>
            <input
              id="hotel-country"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-rooms" className="text-sm font-medium">
              Rooms
            </label>
            <input
              id="hotel-rooms"
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.rooms}
              onChange={(event) => setForm({ ...form, rooms: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-check-in" className="text-sm font-medium">
              Check-in
            </label>
            <input
              id="hotel-check-in"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.checkIn}
              onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-check-out" className="text-sm font-medium">
              Check-out
            </label>
            <input
              id="hotel-check-out"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.checkOut}
              onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-room-type" className="text-sm font-medium">
              Room Type
            </label>
            <input
              id="hotel-room-type"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.roomType}
              onChange={(event) => setForm({ ...form, roomType: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="hotel-confirmation-number" className="text-sm font-medium">
              Confirmation Number
            </label>
            <input
              id="hotel-confirmation-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.confirmationNumber}
              onChange={(event) => setForm({ ...form, confirmationNumber: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="hotel-board-type" className="text-sm font-medium">
            Board Type
          </label>
          <select
            id="hotel-board-type"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.boardType}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isBoardType(value)) {
                setForm({ ...form, boardType: value as BoardType | "" });
              }
            }}
          >
            <option value="">Select a board type</option>
            {BOARD_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {BOARD_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {createHotel.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the hotel. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createHotel.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createHotel.isPending}>
            {createHotel.isPending ? "Adding…" : "Add Hotel"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
