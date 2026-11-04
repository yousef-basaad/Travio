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
  LtrText,
} from "@travio/ui";
import { DOCUMENT_TYPE_KEYS } from "../utils/label-keys";
import type { Document } from "@travio/api";
import { useDeleteDocument } from "../api/documents.api";
import { DocumentsEmptyState } from "./empty-state";
import { DocumentPreview } from "./document-preview";
import type { DocumentTypeFilter } from "./document-filters";
import { formatFileSize } from "../utils/format-file-size";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

export interface DocumentTableProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  isError: boolean;
  typeFilter: DocumentTypeFilter;
  onUploadClick: () => void;
}

export function DocumentTable({
  documents,
  isLoading,
  isError,
  typeFilter,
  onUploadClick,
}: DocumentTableProps) {
  const t = useT();
  const format = useFormat();
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
        loadingLabel={t("documents.loading")}
        errorMessage={t("documents.error")}
      >
        {filtered.length === 0 ? (
          <DocumentsEmptyState
            action={
              <Button size="sm" onClick={onUploadClick}>
                {t("documents.upload")}
              </Button>
            }
          />
        ) : (
          <Table aria-label={t("nav.documents")} caption={t("documents.captionOwner")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("documents.file")}</TableCell>
                <TableCell header>{t("documents.typeShort")}</TableCell>
                <TableCell header>{t("documents.size")}</TableCell>
                <TableCell header>{t("documents.uploaded")}</TableCell>
                <TableCell header>
                  <span className="sr-only">{t("common.actions")}</span>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.fileName}</TableCell>
                  <TableCell>{t(DOCUMENT_TYPE_KEYS[document.documentType])}</TableCell>
                  <TableCell><LtrText>{formatFileSize(document.fileSize)}</LtrText></TableCell>
                  <TableCell>{format.date(document.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewing(document)}
                        aria-label={t("documents.previewNamed", { name: document.fileName })}
                      >
                        {t("documents.preview")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument.mutate({ id: document.id })}
                        disabled={deleteDocument.isPending && deleteDocument.variables?.id === document.id}
                        aria-label={t("documents.deleteNamed", { name: document.fileName })}
                      >
                        {deleteDocument.isPending && deleteDocument.variables?.id === document.id
                          ? t("common.deleting")
                          : t("common.delete")}
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
