"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@travio/ui";
import type { CrmLead } from "@travio/api";
import { useUpdateLead } from "../api/leads.api";
import {
  editLeadFormSchema,
  CRM_LEAD_STATUS_OPTIONS,
  type EditLeadFormValues,
} from "../schemas/edit-lead.schema";
import { CRM_LEAD_SOURCE_OPTIONS } from "../schemas/create-lead.schema";
import { humanize } from "../utils/humanize";

type EditLeadDialogProps = {
  lead: CrmLead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(lead: CrmLead): EditLeadFormValues {
  return {
    fullName: lead.fullName,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    source: lead.source ?? null,
    status: lead.status,
    assignedTo: lead.assignedTo ?? "",
  };
}

// Mirrors CreateLeadDialog's native <dialog> pattern (see that file's
// comment for why: no dialog primitive exists anywhere in the project,
// and this issue's scope is apps/dashboard only).
export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const updateLead = useUpdateLead();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadFormSchema),
    defaultValues: toFormValues(lead),
  });

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      setSubmitError(null);
      reset(toFormValues(lead));
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // Only re-run when the dialog is asked to open/close - reset() already
    // re-reads the latest `lead` at that moment via the closure below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await updateLead.mutateAsync({ id: lead.id, input: values });
      onOpenChange(false);
    } catch {
      // Keep the dialog open and the entered values intact (reset() is
      // only called on success, same as CreateLeadDialog).
      setSubmitError("Couldn't save changes. Please try again.");
    }
  });

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      aria-labelledby="edit-lead-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={onSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-lead-title" className="text-lg font-semibold">
          Edit Lead
        </h2>

        <div className="space-y-1">
          <label htmlFor="edit-lead-full-name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="edit-lead-full-name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            aria-invalid={errors.fullName ? "true" : "false"}
            aria-describedby={errors.fullName ? "edit-lead-full-name-error" : undefined}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="edit-lead-full-name-error" className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-lead-phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="edit-lead-phone"
            className="w-full rounded-md border px-3 py-2 text-sm"
            {...register("phone")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-lead-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="edit-lead-email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "edit-lead-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="edit-lead-email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-lead-source" className="text-sm font-medium">
            Source
          </label>
          <select
            id="edit-lead-source"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("source")}
          >
            <option value="">Select a source</option>
            {CRM_LEAD_SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>
                {humanize(source)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-lead-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="edit-lead-status"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("status")}
          >
            {CRM_LEAD_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-lead-assigned-to" className="text-sm font-medium">
            Assigned To
          </label>
          <input
            id="edit-lead-assigned-to"
            placeholder="Unassigned"
            className="w-full rounded-md border px-3 py-2 text-sm"
            aria-invalid={errors.assignedTo ? "true" : "false"}
            aria-describedby={errors.assignedTo ? "edit-lead-assigned-to-error" : undefined}
            {...register("assignedTo")}
          />
          {errors.assignedTo && (
            <p id="edit-lead-assigned-to-error" className="text-sm text-destructive">
              {errors.assignedTo.message}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
