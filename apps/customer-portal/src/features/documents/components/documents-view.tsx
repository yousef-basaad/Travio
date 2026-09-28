"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  DataTableState,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { DOCUMENT_TYPE_LABELS } from "@travio/types";
import type { Document } from "@travio/api";
import { useDocuments } from "../api/documents.api";
import { DocumentPreview } from "./document-preview";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Read-only: reuses documentService (via GET /api/documents) exactly as
// the dashboard does, minus upload/delete - a customer never manages
// documents, only views and downloads what their agency has attached to
// them, their bookings, or their invoices.
export function DocumentsView() {
  const { data: documents, isLoading, isError } = useDocuments();
  const [previewing, setPreviewing] = useState<Document | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title="Documents" description="Files your agency has shared with you" />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!documents || documents.length === 0)}
        loadingLabel="Loading your documents"
        errorMessage="Something went wrong loading your documents. Please try again later."
        emptyMessage="No documents yet"
        emptyIcon={<FileText size={20} />}
        size="page"
      >
        <Table aria-label="Documents" caption="Documents shared with you by your agency">
          <TableHeader>
            <TableRow>
              <TableCell header>File</TableCell>
              <TableCell header>Type</TableCell>
              <TableCell header>Size</TableCell>
              <TableCell header>Uploaded</TableCell>
              <TableCell header>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(documents ?? []).map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium text-foreground">{document.fileName}</TableCell>
                <TableCell>{DOCUMENT_TYPE_LABELS[document.documentType]}</TableCell>
                <TableCell className="text-muted-foreground">{formatFileSize(document.fileSize)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(document.createdAt)}</TableCell>
                <TableCell align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewing(document)}
                    aria-label={`Preview ${document.fileName}`}
                  >
                    Preview
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      <DocumentPreview
        document={previewing}
        open={previewing !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewing(null);
        }}
      />
    </div>
  );
}
