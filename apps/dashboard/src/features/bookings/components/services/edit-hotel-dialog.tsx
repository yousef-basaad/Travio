"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { BookingHotel, BoardType } from "../../types/booking";
import { useUpdateHotel } from "../../api/bookings.api";
import { BOARD_TYPE_LABELS } from "./hotel-item";
import { isBoardType } from "./create-hotel-dialog";

const BOARD_TYPE_OPTIONS: BoardType[] = [
  "room_only",
  "bed_breakfast",
  "half_board",
  "full_board",
  "all_inclusive",
];

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

function toFormValues(hotel: BookingHotel): typeof EMPTY_FORM {
  return {
    hotelName: hotel.hotelName ?? "",
    city: hotel.city ?? "",
    country: hotel.country ?? "",
    checkIn: toDateTimeLocalValue(hotel.checkIn),
    checkOut: toDateTimeLocalValue(hotel.checkOut),
    rooms: hotel.rooms !== null ? String(hotel.rooms) : "",
    roomType: hotel.roomType ?? "",
    boardType: hotel.boardType ?? "",
    confirmationNumber: hotel.confirmationNumber ?? "",
  };
}

type EditHotelDialogProps = {
  hotel: BookingHotel | null;
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. `hotel` is only
// meaningfully non-null while `open` is true.
export function EditHotelDialog({ hotel, bookingId, open, onOpenChange }: EditHotelDialogProps) {
  const updateHotel = useUpdateHotel();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open && hotel) {
      setForm(toFormValues(hotel));
      updateHotel.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotel]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!hotel) return;

    const trimmedRooms = form.rooms.trim();
    const parsedRooms = trimmedRooms === "" ? null : Number(trimmedRooms);

    // Full-state submit - clearing a field sends an explicit null so
    // bookingHotelsService's update mapper actually clears the column,
    // same reasoning as EditFlightDialog.
    updateHotel.mutate(
      {
        id: hotel.id,
        bookingId,
        hotelName: form.hotelName.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        checkIn: form.checkIn ? new Date(form.checkIn).toISOString() : null,
        checkOut: form.checkOut ? new Date(form.checkOut).toISOString() : null,
        rooms: parsedRooms !== null && Number.isFinite(parsedRooms) ? parsedRooms : null,
        roomType: form.roomType.trim() || null,
        boardType: form.boardType || null,
        confirmationNumber: form.confirmationNumber.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateHotel.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateHotel.isPending}
      aria-labelledby="edit-hotel-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-hotel-title" className="text-lg font-semibold">
          Edit Hotel
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="edit-hotel-name" className="text-sm font-medium">
              Hotel Name
            </label>
            <input
              id="edit-hotel-name"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.hotelName}
              onChange={(event) => setForm({ ...form, hotelName: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-city" className="text-sm font-medium">
              City
            </label>
            <input
              id="edit-hotel-city"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-country" className="text-sm font-medium">
              Country
            </label>
            <input
              id="edit-hotel-country"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-rooms" className="text-sm font-medium">
              Rooms
            </label>
            <input
              id="edit-hotel-rooms"
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.rooms}
              onChange={(event) => setForm({ ...form, rooms: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-check-in" className="text-sm font-medium">
              Check-in
            </label>
            <input
              id="edit-hotel-check-in"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.checkIn}
              onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-check-out" className="text-sm font-medium">
              Check-out
            </label>
            <input
              id="edit-hotel-check-out"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.checkOut}
              onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-room-type" className="text-sm font-medium">
              Room Type
            </label>
            <input
              id="edit-hotel-room-type"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.roomType}
              onChange={(event) => setForm({ ...form, roomType: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-hotel-confirmation-number" className="text-sm font-medium">
              Confirmation Number
            </label>
            <input
              id="edit-hotel-confirmation-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.confirmationNumber}
              onChange={(event) => setForm({ ...form, confirmationNumber: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-hotel-board-type" className="text-sm font-medium">
            Board Type
          </label>
          <select
            id="edit-hotel-board-type"
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

        {updateHotel.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateHotel.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateHotel.isPending}>
            {updateHotel.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
