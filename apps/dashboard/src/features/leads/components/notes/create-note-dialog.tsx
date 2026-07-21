"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@travio/ui";
import { useCreateLeadNote } from "../../api/leads.api";

type CreateNoteDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors CreateLeadDialog/EditLeadDialog's native <dialog> pattern (see
// those files' comments for why: no dialog primitive exists anywhere in
// the project, and this scope is apps/dashboard only). A single required
// textarea doesn't need react-hook-form/zod the way the multi-field lead
// forms do - plain state and a manual check are proportionate here.
export function CreateNoteDialog({ leadId, open, onOpenChange }: CreateNoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createNote = useCreateLeadNote();
  const [body, setBody] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

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
      setValidationError("Note cannot be empty.");
      return;
    }
    setValidationError(null);

    createNote.mutate(
      { leadId, body: trimmed },
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
      aria-labelledby="create-note-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-note-title" className="text-lg font-semibold">
          Add Note
        </h2>

        <div className="space-y-1">
          <label htmlFor="note-body" className="text-sm font-medium">
            Note
          </label>
          <textarea
            id="note-body"
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-invalid={validationError ? "true" : "false"}
            aria-describedby={validationError ? "note-body-error" : undefined}
          />
          {validationError && (
            <p id="note-body-error" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>

        {createNote.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn't add the note. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createNote.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createNote.isPending}>
            {createNote.isPending ? "Adding…" : "Add Note"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
