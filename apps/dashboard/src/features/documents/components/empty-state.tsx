"use client";

import { EmptyState } from "@travio/ui";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n/i18n-provider";

// Thin, documents-specific usage of the shared EmptyState (title +
// description + action slot) - not a new primitive.
export function DocumentsEmptyState({ action }: { action?: ReactNode }) {
  const t = useT();
  return (
    <EmptyState
      title={t("documents.empty")}
      description={t("documents.emptyDescription")}
      action={action}
    />
  );
}
