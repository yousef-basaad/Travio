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
import { useI18n } from "@/lib/i18n/i18n-provider";
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
  const { t, format } = useI18n();
  const [previewing, setPreviewing] = useState<Document | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title={t("documents.title")} description={t("documents.description")} />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!documents || documents.length === 0)}
        loadingLabel={t("documents.loading")}
        errorMessage={t("documents.error")}
        emptyMessage={t("documents.empty")}
        emptyIcon={<FileText size={20} />}
        size="page"
      >
        <Table aria-label={t("documents.tableLabel")} caption={t("documents.caption")}>
          <TableHeader>
            <TableRow>
              <TableCell header>{t("documents.col.file")}</TableCell>
              <TableCell header>{t("documents.col.type")}</TableCell>
              <TableCell header>{t("documents.col.size")}</TableCell>
              <TableCell header>{t("documents.col.uploaded")}</TableCell>
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(documents ?? []).map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium text-foreground">{document.fileName}</TableCell>
                <TableCell>{t(`documentType.${document.documentType}`)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span dir="ltr">{formatFileSize(document.fileSize)}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{format.date(document.createdAt)}</TableCell>
                <TableCell align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewing(document)}
                    aria-label={t("documents.previewNamed", { name: document.fileName })}
                  >
                    {t("documents.preview")}
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
