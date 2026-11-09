"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@travio/ui";
import type { CrmLead } from "@travio/api";
import { useConvertLead, ConvertLeadError } from "../api/leads.api";
import { useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

type ConvertLeadDialogProps = {
  lead: CrmLead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ERROR_MESSAGES: Record<number, MessageKey> = {
  404: "leads.convert.notFound",
  409: "leads.convert.alreadyConverted",
  403: "leads.convert.forbidden",
};

function getErrorMessage(error: unknown): MessageKey {
  if (error instanceof ConvertLeadError) {
    return ERROR_MESSAGES[error.status] ?? "common.genericError";
  }
  return "common.genericError";
}

// Mirrors Create/EditLeadDialog's native <dialog> pattern (same reasoning:
// no dialog primitive exists, scope is apps/dashboard only). No form here -
// this is a confirmation, not data entry - so no react-hook-form/zod.
export function ConvertLeadDialog({ lead, open, onOpenChange }: ConvertLeadDialogProps) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const convertLead = useConvertLead();

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      convertLead.reset();
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConvert = () => {
    convertLead.mutate(
      { id: lead.id, forceCreateNew: false },
      {
        onSuccess: () => {
          onOpenChange(false);
          // No customer detail page exists yet - fall back to the list,
          // per this issue's explicit instruction.
          router.push("/customers");
        },
      },
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        // Block ESC while the mutation is in flight - same intent as
        // disabling the buttons below, just for the one path a disabled
        // button doesn't cover.
        if (convertLead.isPending) {
          event.preventDefault();
        }
      }}
      aria-labelledby="convert-lead-title"
      className="w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <h2 id="convert-lead-title" className="text-lg font-semibold">
          {t("leads.convert.title")}
        </h2>

        <p className="text-sm text-muted-foreground">
          {t("leads.convert.body")} {t("leads.convert.marksAs")}{" "}
          <span className="font-medium text-foreground">{t("leadStatus.won")}</span>.
        </p>

        {convertLead.isError && (
          <p role="alert" className="text-sm text-danger">
            {t(getErrorMessage(convertLead.error))}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convertLead.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleConvert} disabled={convertLead.isPending}>
            {convertLead.isPending ? t("leads.convert.converting") : t("leads.convert.action")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
