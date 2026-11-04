"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@travio/ui";
import { DOCUMENT_TYPES, type DocumentType } from "@travio/types";
import { DOCUMENT_TYPE_KEYS } from "../utils/label-keys";
import type { OwnerType } from "@travio/api";
import { useUploadDocument } from "../api/documents.api";
import { useT } from "@/lib/i18n/i18n-provider";

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
  const t = useT();
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
      setValidationError(t("documents.chooseFile"));
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
          {t("documents.upload")}
        </h2>

        <FormField label={t("documents.type")} htmlFor="document-type">
          <Select
            id="document-type"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(DOCUMENT_TYPE_KEYS[type])}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label={t("documents.file")} htmlFor="document-file" error={validationError ?? undefined}>
          <Input
            id="document-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("documents.fileHint")}</p>
        </FormField>

        {uploadDocument.isError && (
          <p role="alert" className="text-sm text-danger">
            {uploadDocument.error instanceof Error
              ? uploadDocument.error.message
              : t("documents.uploadError")}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadDocument.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={uploadDocument.isPending}>
            {uploadDocument.isPending ? t("documents.uploading") : t("documents.uploadSubmit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
