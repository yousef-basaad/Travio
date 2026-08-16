import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@travio/utils";

// Formalizes the input/textarea/select className strings that were
// previously copy-pasted independently across ~20 dialog files (94
// occurrences of the exact same "w-full rounded-md border px-3 py-2
// text-sm" string). Same markup, now shared.
//
// Design System v2.0: adds a focus ring (was previously invisible on
// every text control - only Button had one), a disabled state, and an
// explicit `invalid` prop (rather than relying on a `aria-invalid:`
// Tailwind variant, which isn't guaranteed available in this project's
// installed Tailwind version) that callers set alongside
// aria-invalid={...} - same source of truth, driven from JS instead of
// a CSS attribute selector.
const CONTROL_BASE =
  "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-colors duration-fast ease-default placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70";

const INVALID_CLASSES = "border-danger focus-visible:ring-danger focus-visible:border-danger";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Applies the shared invalid-state styling (paired with aria-invalid). */
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(CONTROL_BASE, invalid && INVALID_CLASSES, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(CONTROL_BASE, invalid && INVALID_CLASSES, className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(CONTROL_BASE, invalid && INVALID_CLASSES, className)}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string | null;
  /** Optional helper/hint text shown under the control when there's no error. */
  hint?: string;
  children: ReactNode;
}

// Formalizes the "<label> + control + error <p>" wrapper repeated around
// nearly every Input/Textarea/Select in every create/edit dialog. The
// error <p> gets a `${htmlFor}-error` id, matching the react-hook-form
// dialogs' existing aria-describedby convention (e.g. CreateBookingForm) -
// the caller still wires aria-describedby={error ? \`${htmlFor}-error\` :
// undefined} on its own control, same as before; this just makes sure
// the id it points at actually exists.
export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
