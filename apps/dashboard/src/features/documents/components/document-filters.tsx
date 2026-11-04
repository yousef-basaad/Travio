"use client";

import { Select } from "@travio/ui";
import { DOCUMENT_TYPES, type DocumentType } from "@travio/types";
import { DOCUMENT_TYPE_KEYS } from "../utils/label-keys";
import { useT } from "@/lib/i18n/i18n-provider";

export type DocumentTypeFilter = DocumentType | "all";

export interface DocumentFiltersProps {
  value: DocumentTypeFilter;
  onChange: (value: DocumentTypeFilter) => void;
}

// A single filter (document type) - the only dimension worth filtering
// on at this scope (a customer's or booking's own documents), reusing
// DOCUMENT_TYPES/DOCUMENT_TYPE_LABELS from @travio/types rather than a
// second hardcoded list.
export function DocumentFilters({ value, onChange }: DocumentFiltersProps) {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="document-type-filter" className="text-sm text-muted-foreground">
        {t("documents.typeShort")}
      </label>
      <Select
        id="document-type-filter"
        className="w-auto"
        value={value}
        onChange={(event) => onChange(event.target.value as DocumentTypeFilter)}
      >
        <option value="all">{t("documents.allTypes")}</option>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {t(DOCUMENT_TYPE_KEYS[type])}
          </option>
        ))}
      </Select>
    </div>
  );
}
