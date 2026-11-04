"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { FileText } from "lucide-react";
import {
  Button,
  PageHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SearchInput,
  Select,
  LtrText,
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { DOCUMENT_TYPES, OWNER_TYPES, type OwnerType } from "@travio/types";
import { DOCUMENT_TYPE_KEYS, OWNER_TYPE_KEYS } from "../utils/label-keys";
import type { DocumentListItem } from "@travio/api";
import { useDocumentsPage, useDeleteDocument } from "../api/documents.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { DocumentPreview } from "./document-preview";
import type { DocumentTypeFilter } from "./document-filters";
import { formatFileSize } from "../utils/format-file-size";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

type OwnerTypeFilter = OwnerType | "all";

// Where "attached to" links: the owner's own page, when it has one.
function ownerHref(document: DocumentListItem): Route | null {
  if (!document.ownerId) return null;
  if (document.ownerType === "customer") return `/customers/${document.ownerId}` as Route;
  if (document.ownerType === "booking") return `/bookings/${document.ownerId}` as Route;
  return null;
}

function AttachedTo({ document }: { document: DocumentListItem }) {
  const t = useT();
  const typeLabel = t(OWNER_TYPE_KEYS[document.ownerType]);
  if (document.ownerType === "agency") return <span className="text-muted-foreground">{typeLabel}</span>;

  const name = document.ownerLabel ?? "—";
  const href = ownerHref(document);
  return (
    <span>
      <span className="text-muted-foreground">{typeLabel}{t("documents.ownerSeparator")}</span>
      {href && document.ownerLabel ? (
        <Link href={href} className="underline-offset-2 hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
    </span>
  );
}

// The whole agency's documents in one place: server-paged, filterable by
// what they're attached to and by type, searchable by file name. Uploads
// stay on a customer's or booking's own Documents tab, since every
// document needs an owner.
export function DocumentsWorkspace() {
  const t = useT();
  const format = useFormat();
  const [ownerType, setOwnerType] = useState<OwnerTypeFilter>("all");
  const [documentType, setDocumentType] = useState<DocumentTypeFilter>("all");
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(`${ownerType}|${documentType}`);
  const { data, isLoading, isError, isFetching } = useDocumentsPage({
    page,
    pageSize,
    search: debouncedSearch,
    ownerType: ownerType === "all" ? undefined : ownerType,
    documentType: documentType === "all" ? undefined : documentType,
  });
  const documents = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

  const deleteDocument = useDeleteDocument();
  const [previewing, setPreviewing] = useState<DocumentListItem | null>(null);
  const isFiltered = Boolean(debouncedSearch) || ownerType !== "all" || documentType !== "all";

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.documents")} description={t("documents.description")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder={t("documents.searchPlaceholder")}
          aria-label={t("documents.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="max-w-sm flex-1"
        />
        <Select
          aria-label={t("documents.attachedTo")}
          className="w-auto"
          value={ownerType}
          onChange={(event) => setOwnerType(event.target.value as OwnerTypeFilter)}
        >
          <option value="all">{t("documents.attachedToAll")}</option>
          {OWNER_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(OWNER_TYPE_KEYS[type])}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("documents.type")}
          className="w-auto"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as DocumentTypeFilter)}
        >
          <option value="all">{t("documents.allTypes")}</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(DOCUMENT_TYPE_KEYS[type])}
            </option>
          ))}
        </Select>
      </div>

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && documents.length === 0}
        loadingLabel={t("documents.loading")}
        errorMessage={t("documents.error")}
        emptyMessage={isFiltered ? t("documents.emptyFiltered") : t("documents.empty")}
        emptyAction={
          !isFiltered ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">{t("documents.uploadFromProfile")}</Link>
            </Button>
          ) : undefined
        }
        emptyIcon={<FileText size={20} />}
        size="page"
      >
        <Table aria-label={t("nav.documents")} caption={t("documents.caption")}>
          <TableHeader>
            <TableRow className="text-muted-foreground">
              <TableCell header>{t("documents.file")}</TableCell>
              <TableCell header>{t("documents.typeShort")}</TableCell>
              <TableCell header>{t("documents.attachedTo")}</TableCell>
              <TableCell header>{t("documents.size")}</TableCell>
              <TableCell header>{t("documents.uploaded")}</TableCell>
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => {
              const isDeleting = deleteDocument.isPending && deleteDocument.variables?.id === document.id;
              return (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.fileName}</TableCell>
                  <TableCell>{t(DOCUMENT_TYPE_KEYS[document.documentType])}</TableCell>
                  <TableCell>
                    <AttachedTo document={document} />
                  </TableCell>
                  <TableCell><LtrText>{formatFileSize(document.fileSize)}</LtrText></TableCell>
                  <TableCell>{format.date(document.createdAt)}</TableCell>
                  <TableCell align="end">
                    <div className="flex items-center justify-end gap-1">
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
                        disabled={isDeleting}
                        aria-label={t("documents.deleteNamed", { name: document.fileName })}
                      >
                        {isDeleting ? t("common.deleting") : t("common.delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataTableState>

      {data && (
        <AppPagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} disabled={isFetching} />
      )}

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
