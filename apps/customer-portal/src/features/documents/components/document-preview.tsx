"use client";

import { useEffect } from "react";
import { Dialog, Button } from "@travio/ui";
import type { Document } from "@travio/api";
import { useSignedUrl } from "../api/documents.api";

// Mirrors apps/dashboard's own DocumentPreview exactly - images and PDFs
// render inline via the browser's own capabilities, everything else is
// download-only.
function isPreviewable(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

export interface DocumentPreviewProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({ document, open, onOpenChange }: DocumentPreviewProps) {
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
            Loading preview…
          </div>
        ) : signedUrl.isError ? (
          <p role="alert" className="text-sm text-danger">
            Couldn't load a preview. Please try again.
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
            This file type can't be previewed inline. Use Download below.
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {signedUrl.data ? (
            <Button asChild>
              <a href={signedUrl.data.url} download={document.fileName} target="_blank" rel="noreferrer">
                Download
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
