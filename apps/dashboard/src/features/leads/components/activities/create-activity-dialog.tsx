"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@travio/ui";
import type { CrmActivityType } from "@travio/api";
import { useCreateLeadActivity } from "../../api/leads.api";
import { humanize } from "../../utils/humanize";

// Matches crm_activities_type_check exactly. Exported so
// edit-activity-dialog.tsx reuses the same list/guard rather than
// duplicating it (packages/api is out of scope for this issue, so this
// can't live in the mapper alongside CrmActivityType itself).
export const ACTIVITY_TYPE_OPTIONS: CrmActivityType[] = [
  "call",
  "email",
  "meeting",
  "whatsapp",
  "task",
  "follow_up",
];

export function isCrmActivityType(value: string): value is CrmActivityType {
  return (ACTIVITY_TYPE_OPTIONS as readonly string[]).includes(value);
}

type CreateActivityDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors CreateLeadDialog/CreateNoteDialog's native <dialog> pattern (see
// those files' comments for why: no dialog primitive exists anywhere in
// the project, and this scope is apps/dashboard only).
export function CreateActivityDialog({ leadId, open, onOpenChange }: CreateActivityDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createActivity = useCreateLeadActivity();
  const [type, setType] = useState<CrmActivityType>("call");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      setType("call");
      setTitle("");
      setDescription("");
      setValidationError(null);
      createActivity.reset();
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setValidationError("Title is required.");
      return;
    }
    setValidationError(null);

    createActivity.mutate(
      { leadId, type, title: trimmedTitle, description: description.trim() || null },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is
        // (no reset() on failure) - createActivity.isError surfaces the
        // friendly message below.
      },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (createActivity.isPending) {
          event.preventDefault();
        }
      }}
      aria-labelledby="create-activity-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-activity-title" className="text-lg font-semibold">
          Add Activity
        </h2>

        <div className="space-y-1">
          <label htmlFor="activity-type" className="text-sm font-medium">
            Activity Type
          </label>
          <select
            id="activity-type"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={type}
            onChange={(event) => {
              const value = event.target.value;
              if (isCrmActivityType(value)) {
                setType(value);
              }
            }}
          >
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="activity-title-field" className="text-sm font-medium">
            Title
          </label>
          <input
            id="activity-title-field"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={validationError ? "true" : "false"}
            aria-describedby={validationError ? "activity-title-error" : undefined}
          />
          {validationError && (
            <p id="activity-title-error" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="activity-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="activity-description"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {createActivity.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn't add the activity. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createActivity.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createActivity.isPending}>
            {createActivity.isPending ? "Adding…" : "Add Activity"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
