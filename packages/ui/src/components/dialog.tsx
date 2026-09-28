"use client";

import { useEffect, useRef, type DialogHTMLAttributes, type ReactNode } from "react";
import { cn } from "@travio/utils";

export interface DialogProps
  extends Omit<
    DialogHTMLAttributes<HTMLDialogElement>,
    "children" | "open" | "onClose" | "onCancel"
  > {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Block ESC/backdrop dismissal while true - every create/edit dialog
   * in this app sets this from its own mutation's isPending.
   */
  preventClose?: boolean;
  children: ReactNode;
}

// Shared <dialog> shell: showModal()/close() wiring, backdrop styling,
// and cancel-prevention-while-pending - the boilerplate every
// create/edit dialog previously duplicated. Forms/fields stay entirely
// in each feature's own dialog component; this owns only the modal
// mechanics, never form state or field markup.
export function Dialog({
  open,
  onOpenChange,
  preventClose = false,
  className,
  children,
  ...props
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (open && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (preventClose) {
          event.preventDefault();
        }
      }}
      className={cn(
        // Design System v2.0: rounded-lg/shadow-lg resolve to the new
        // token values automatically (larger radius, subtler elevation).
        "w-full max-w-md rounded-lg border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-black/50",
        className,
      )}
      {...props}
    >
      {children}
    </dialog>
  );
}
