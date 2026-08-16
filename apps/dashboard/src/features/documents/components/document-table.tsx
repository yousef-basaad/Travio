"use client";

import { useState } from "react";
import {
  Button,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { DOCUMENT_TYPE_LABELS } from "@travio/types";
import type { Document, OwnerType } from "@travio/api";
import { useDeleteDocument } from "../api/documents.api";
import { DocumentsEmptyState } from "./empty-state";
import { DocumentPreview } from "./document-preview";
import type { DocumentTypeFilter } from "./document-filters";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DocumentTableProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  isError: boolean;
  ownerType: OwnerType;
  ownerId: string;
  typeFilter: DocumentTypeFilter;
  onUploadClick: () => void;
}

export function DocumentTable({
  documents,
  isLoading,
  isError,
  ownerType,
  ownerId,
  typeFilter,
  onUploadClick,
}: DocumentTableProps) {
  const deleteDocument = useDeleteDocument();
  const [previewing, setPreviewing] = useState<Document | null>(null);

  const filtered = (documents ?? []).filter(
    (document) => typeFilter === "all" || document.documentType === typeFilter,
  );

  return (
    <>
      <DataTableState
        isLoading={isLoading}
        isError={isError}
        // isEmpty is handled below (not via DataTableState's own
        // message-only EmptyState) so the richer title+description
        // DocumentsEmptyState renders instead.
        isEmpty={false}
        loadingLabel="Loading documents"
        errorMessage="Something went wrong loading documents. Please try again later."
      >
        {filtered.length === 0 ? (
          <DocumentsEmptyState
            action={
              <Button size="sm" onClick={onUploadClick}>
                Upload Document
              </Button>
            }
          />
        ) : (
          <Table aria-label="Documents" caption="Documents attached to this record">
            <TableHeader>
              <TableRow className="text-muted-foreground">
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
              {filtered.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.fileName}</TableCell>
                  <TableCell>{DOCUMENT_TYPE_LABELS[document.documentType]}</TableCell>
                  <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell>{formatDate(document.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewing(document)}
                        aria-label={`Preview ${document.fileName}`}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument.mutate({ id: document.id, ownerType, ownerId })}
                        disabled={deleteDocument.isPending && deleteDocument.variables?.id === document.id}
                        aria-label={`Delete ${document.fileName}`}
                      >
                        {deleteDocument.isPending && deleteDocument.variables?.id === document.id
                          ? "Deleting…"
                          : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableState>

      <DocumentPreview
        document={previewing}
        open={previewing !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewing(null);
        }}
      />
    </>
  );
}
