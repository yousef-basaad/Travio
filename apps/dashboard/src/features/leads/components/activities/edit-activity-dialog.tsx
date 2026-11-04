"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@travio/ui";
import type { CrmActivity, CrmActivityType } from "@travio/api";
import { useUpdateLeadActivity } from "../../api/leads.api";
import { ACTIVITY_TYPE_KEYS } from "../../utils/label-keys";
import { ACTIVITY_TYPE_OPTIONS, isCrmActivityType } from "./create-activity-dialog";
import { useT } from "@/lib/i18n/i18n-provider";

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
  const t = useT();
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
      setValidationError(t("validation.titleRequired"));
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
          {t("leads.activities.edit")}
        </h2>

        <div className="space-y-1">
          <label htmlFor="edit-activity-type" className="text-sm font-medium">
            {t("leads.activities.type")}
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
                {t(ACTIVITY_TYPE_KEYS[option])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-activity-title-field" className="text-sm font-medium">
            {t("common.title")}
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
            <p id="edit-activity-title-error" className="text-sm text-danger">
              {validationError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-activity-description" className="text-sm font-medium">
            {t("common.description")}
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
          <p role="alert" className="text-sm text-danger">
            {t("common.saveError")}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateActivity.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={updateActivity.isPending}>
            {updateActivity.isPending ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
