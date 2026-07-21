"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@travio/ui";
import type { CrmActivity, CrmActivityType } from "@travio/api";
import { useUpdateLeadActivity } from "../../api/leads.api";
import { humanize } from "../../utils/humanize";
import { ACTIVITY_TYPE_OPTIONS, isCrmActivityType } from "./create-activity-dialog";

type EditActivityDialogProps = {
  activity: CrmActivity | null;
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors EditLeadDialog's native <dialog> pattern. Always mounted (like
// EditLeadDialog) rather than conditionally rendered by the parent, so the
// <dialog> element itself isn't torn down/recreated between edits -
// `activity` is only meaningfully non-null while `open` is true.
export function EditActivityDialog({
  activity,
  leadId,
  open,
  onOpenChange,
}: EditActivityDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const updateActivity = useUpdateLeadActivity();
  const [type, setType] = useState<CrmActivityType>("call");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open && activity) {
      setType(activity.type);
      setTitle(activity.title);
      setDescription(activity.description ?? "");
      setValidationError(null);
      updateActivity.reset();
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activity]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!activity) return;

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setValidationError("Title is required.");
      return;
    }
    setValidationError(null);

    updateActivity.mutate(
      {
        id: activity.id,
        leadId,
        type,
        title: trimmedTitle,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateActivity.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (updateActivity.isPending) {
          event.preventDefault();
        }
      }}
      aria-labelledby="edit-activity-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-activity-title" className="text-lg font-semibold">
          Edit Activity
        </h2>

        <div className="space-y-1">
          <label htmlFor="edit-activity-type" className="text-sm font-medium">
            Activity Type
          </label>
          <select
            id="edit-activity-type"
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
          <label htmlFor="edit-activity-title-field" className="text-sm font-medium">
            Title
          </label>
          <input
            id="edit-activity-title-field"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={validationError ? "true" : "false"}
            aria-describedby={validationError ? "edit-activity-title-error" : undefined}
          />
          {validationError && (
            <p id="edit-activity-title-error" className="text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-activity-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="edit-activity-description"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {updateActivity.isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateActivity.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateActivity.isPending}>
            {updateActivity.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
