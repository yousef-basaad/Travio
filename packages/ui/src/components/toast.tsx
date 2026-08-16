"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@travio/utils";

// Design System v2.4 (Product-8.1): the audit found zero toast/snackbar
// system anywhere - every mutation's success/error feedback was
// reinvented inline, per feature (e.g. the Customer 360 "Invite to
// Portal" button's own local success/error text). This is the single
// shared answer: a tiny store (no external state library) + a
// <Toaster/> that any app mounts once in its providers tree, imperative
// `toast()` call from anywhere else - same "call a function, UI reacts"
// shape React Query mutations already give every feature.

export type ToastVariant = "default" | "success" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. 0 disables auto-dismiss. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

type Listener = (toasts: ToastRecord[]) => void;

// Module-level store, not React context - `toast()` needs to be
// callable from plain async functions (mutation onError/onSuccess
// handlers) without every caller being a component that can useContext.
// Mirrors the same "singleton store outside React" shape a query client
// itself already is.
let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(options: ToastOptions): string {
  const id = crypto.randomUUID();
  const duration = options.duration ?? 5000;
  toasts = [...toasts, { id, ...options }];
  emit();

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }

  return id;
}

function useToasts(): ToastRecord[] {
  const [state, setState] = React.useState<ToastRecord[]>(toasts);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  default: <Info size={18} className="text-info" />,
  success: <CheckCircle2 size={18} className="text-success" />,
  danger: <XCircle size={18} className="text-danger" />,
};

const VARIANT_BORDER: Record<ToastVariant, string> = {
  default: "border-border",
  success: "border-success/30",
  danger: "border-danger/30",
};

// Mounted once per app (dashboard/customer-portal providers) - fixed to
// the bottom-right, matching the reference products' toast placement.
// aria-live="polite" + role="status" per toast so screen readers
// announce new toasts without interrupting whatever the user is doing,
// same convention every other transient status message in this package
// already uses.
export function Toaster() {
  const items = useToasts();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg",
            "animate-in slide-in-from-bottom-2 fade-in-0 duration-base",
            VARIANT_BORDER[item.variant ?? "default"],
          )}
        >
          <span className="mt-0.5 shrink-0" aria-hidden="true">
            {VARIANT_ICON[item.variant ?? "default"]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-accent-foreground"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
