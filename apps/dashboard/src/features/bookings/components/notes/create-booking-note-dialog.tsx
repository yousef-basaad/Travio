"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@travio/ui";
import { useCreateBookingNote } from "../../api/bookings.api";
import { useT } from "@/lib/i18n/i18n-provider";

type CreateBookingNoteDialogProps = {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors leads/components/notes/create-note-dialog.tsx exactly,
// retargeted at bookings - native <dialog> pattern (no dialog primitive
// exists anywhere in the project), plain state + a manual required-field
// check rather than react-hook-form/zod (proportionate for a single
// textarea).
export function CreateBookingNoteDialog({ bookingId, open, onOpenChange }: CreateBookingNoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createNote = useCreateBookingNote();
  const [body, setBody] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      setBody("");
      setValidationError(null);
      createNote.reset();
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setValidationError(t("bookings.notes.emptyError"));
      return;
    }
    setValidationError(null);

    createNote.mutate(
      { bookingId, body: trimmed },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and `body` is left as-is
        // (no reset() on failure) - createNote.isError surfaces the
        // friendly message below.
      },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (createNote.isPending) {
          event.preventDefault();
        }
      }}
      aria-labelledby="create-booking-note-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-booking-note-title" className="text-lg font-semibold">
          {t("bookings.notes.add")}
        </h2>

        <div className="space-y-1">
          <label htmlFor="booking-note-body" className="text-sm font-medium">
            {t("bookings.notes.note")}
          </label>
          <textarea
            id="booking-note-body"
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-invalid={validationError ? "true" : "false"}
            aria-describedby={validationError ? "booking-note-body-error" : undefined}
          />
          {validationError && (
            <p id="booking-note-body-error" className="text-sm text-danger">
              {validationError}
            </p>
          )}
        </div>

        {createNote.isError && (
          <p role="alert" className="text-sm text-danger">
            {t("bookings.notes.addError")}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createNote.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={createNote.isPending}>
            {createNote.isPending ? t("common.adding") : t("bookings.notes.add")}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
