"use client";

import { useEffect } from "react";
import { Dialog, Button } from "@travio/ui";
import type { Document } from "@travio/api";
import { useSignedUrl } from "../api/documents.api";
import { useT } from "@/lib/i18n/i18n-provider";

// Images and PDFs render inline via the browser's own capabilities (no
// PDF/image library) - everything else is download-only, per the
// approved architecture.
function isPreviewable(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

export interface DocumentPreviewProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fetches a fresh 60s signed URL each time it's opened (never cached) -
// see useSignedUrl's own comment for why this is a mutation, not a query.
export function DocumentPreview({ document, open, onOpenChange }: DocumentPreviewProps) {
  const t = useT();
  const signedUrl = useSignedUrl();

  useEffect(() => {
    if (open && document) {
      signedUrl.mutate(document.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document?.id]);

  if (!document) return null;

  const previewable = isPreviewable(document.mimeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="document-preview-title">
      <div className="space-y-4 p-6">
        <h2 id="document-preview-title" className="text-lg font-semibold">
          {document.fileName}
        </h2>

        {signedUrl.isPending ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {t("documents.loadingPreview")}
          </div>
        ) : signedUrl.isError ? (
          <p role="alert" className="text-sm text-danger">
            {t("documents.previewError")}
          </p>
        ) : signedUrl.data && previewable ? (
          document.mimeType === "application/pdf" ? (
            <embed
              src={signedUrl.data.url}
              type="application/pdf"
              className="h-[70vh] w-full rounded-md border"
            />
          ) : (
            <img
              src={signedUrl.data.url}
              alt={document.fileName}
              className="max-h-[70vh] w-full rounded-md border object-contain"
            />
          )
        ) : signedUrl.data ? (
          <p className="text-sm text-muted-foreground">
            {t("documents.noInlinePreview")}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("documents.close")}
          </Button>
          {signedUrl.data ? (
            <Button asChild>
              <a href={signedUrl.data.url} download={document.fileName} target="_blank" rel="noreferrer">
                {t("documents.download")}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
