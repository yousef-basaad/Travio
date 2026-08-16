"use client";

import { Select } from "@travio/ui";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentType } from "@travio/types";

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
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="document-type-filter" className="text-sm text-muted-foreground">
        Type
      </label>
      <Select
        id="document-type-filter"
        className="w-auto"
        value={value}
        onChange={(event) => onChange(event.target.value as DocumentTypeFilter)}
      >
        <option value="all">All types</option>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {DOCUMENT_TYPE_LABELS[type]}
          </option>
        ))}
      </Select>
    </div>
  );
}
