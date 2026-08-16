import { EmptyState } from "@travio/ui";
import type { ReactNode } from "react";

// Thin, documents-specific usage of the shared EmptyState (title +
// description + action slot) - not a new primitive.
export function DocumentsEmptyState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      title="No documents yet"
      description="Upload passports, visas, vouchers, or other files to keep them with this record."
      action={action}
    />
  );
}
