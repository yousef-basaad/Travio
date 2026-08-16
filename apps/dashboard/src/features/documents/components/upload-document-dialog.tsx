"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@travio/ui";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentType } from "@travio/types";
import type { OwnerType } from "@travio/api";
import { useUploadDocument } from "../api/documents.api";

export interface UploadDocumentDialogProps {
  ownerType: OwnerType;
  ownerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. The file uploads directly
// from the browser to Storage (see useUploadDocument's own comment) -
// this dialog never sends file bytes through a Next.js API route.
export function UploadDocumentDialog({
  ownerType,
  ownerId,
  open,
  onOpenChange,
}: UploadDocumentDialogProps) {
  const uploadDocument = useUploadDocument();
  const [documentType, setDocumentType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDocumentType(DOCUMENT_TYPES[0]);
      setFile(null);
      setValidationError(null);
      uploadDocument.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!file) {
      setValidationError("Choose a file to upload.");
      return;
    }

    setValidationError(null);

    uploadDocument.mutate(
      { file, ownerType, ownerId, documentType },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={uploadDocument.isPending}
      aria-labelledby="upload-document-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="upload-document-title" className="text-lg font-semibold">
          Upload Document
        </h2>

        <FormField label="Document Type" htmlFor="document-type">
          <Select
            id="document-type"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="File" htmlFor="document-file" error={validationError ?? undefined}>
          <Input
            id="document-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-muted-foreground">PDF, JPEG, PNG, or WebP. Max 10MB.</p>
        </FormField>

        {uploadDocument.isError && (
          <p role="alert" className="text-sm text-danger">
            {uploadDocument.error instanceof Error
              ? uploadDocument.error.message
              : "Couldn't upload the document. Please try again."}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadDocument.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploadDocument.isPending}>
            {uploadDocument.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
