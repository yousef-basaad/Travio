"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@travio/ui";
import { useCreateLead } from "../api/leads.api";
import {
  createLeadFormSchema,
  CRM_LEAD_SOURCE_OPTIONS,
  type CreateLeadFormValues,
} from "../schemas/create-lead.schema";
import { LEAD_SOURCE_KEYS } from "../utils/label-keys";
import { isMessageKey } from "@/lib/i18n/translate";
import { useT } from "@/lib/i18n/i18n-provider";

const DEFAULT_VALUES: CreateLeadFormValues = {
  fullName: "",
  phone: "",
  email: "",
  source: undefined,
};

type CreateLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Uses the native <dialog> element rather than a Radix/headless-UI
// primitive: no dialog component exists anywhere in the project yet, and
// this issue's scope is apps/dashboard only, so adding a shared primitive
// to packages/ui is out of bounds. <dialog>.showModal() gives ESC-to-close,
// focus trapping, and focus restoration on close for free, per the HTML
// spec - no extra dependency, no hand-rolled focus-trap code.
export function CreateLeadDialog({ open, onOpenChange }: CreateLeadDialogProps) {
  const t = useT();
  const fieldError = (message?: string) => (message && isMessageKey(message) ? t(message) : message);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createLead = useCreateLead();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      setSubmitError(null);
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  }, [open]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createLead.mutateAsync(values);
      reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch {
      // Keep the dialog open and the entered values intact (reset() is
      // only called on success) - just surface a friendly message.
      setSubmitError(t("leads.createError"));
    }
  });

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      aria-labelledby="create-lead-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <form onSubmit={onSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-lead-title" className="text-lg font-semibold">
          {t("leads.new")}
        </h2>

        <div className="space-y-1">
          <label htmlFor="lead-full-name" className="text-sm font-medium">
            {t("field.fullName")}
          </label>
          <input
            id="lead-full-name"
            className="w-full rounded-md border px-3 py-2 text-sm"
            aria-invalid={errors.fullName ? "true" : "false"}
            aria-describedby={errors.fullName ? "lead-full-name-error" : undefined}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="lead-full-name-error" className="text-sm text-danger">
              {fieldError(errors.fullName.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="lead-phone" className="text-sm font-medium">
            {t("field.phone")}
          </label>
          <input
            id="lead-phone"
            type="tel"
            className="w-full rounded-md border px-3 py-2 text-sm"
            {...register("phone")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="lead-email" className="text-sm font-medium">
            {t("field.email")}
          </label>
          <input
            id="lead-email"
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "lead-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="lead-email-error" className="text-sm text-danger">
              {fieldError(errors.email.message)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="lead-source" className="text-sm font-medium">
            {t("field.source")}
          </label>
          <select
            id="lead-source"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            {...register("source")}
          >
            <option value="">{t("leads.selectSource")}</option>
            {CRM_LEAD_SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>
                {t(LEAD_SOURCE_KEYS[source])}
              </option>
            ))}
          </select>
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-danger">
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
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.creating") : t("leads.create")}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
