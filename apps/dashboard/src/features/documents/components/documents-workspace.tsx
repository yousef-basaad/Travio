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
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { formatDate } from "@travio/utils";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, OWNER_TYPES, type OwnerType } from "@travio/types";
import type { DocumentListItem } from "@travio/api";
import { useDocumentsPage, useDeleteDocument } from "../api/documents.api";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { DocumentPreview } from "./document-preview";
import type { DocumentTypeFilter } from "./document-filters";
import { formatFileSize } from "../utils/format-file-size";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  customer: "Customer",
  booking: "Booking",
  invoice: "Invoice",
  agency: "Agency",
};

type OwnerTypeFilter = OwnerType | "all";

// Where "attached to" links: the owner's own page, when it has one.
function ownerHref(document: DocumentListItem): Route | null {
  if (!document.ownerId) return null;
  if (document.ownerType === "customer") return `/customers/${document.ownerId}` as Route;
  if (document.ownerType === "booking") return `/bookings/${document.ownerId}` as Route;
  return null;
}

function AttachedTo({ document }: { document: DocumentListItem }) {
  const typeLabel = OWNER_TYPE_LABELS[document.ownerType];
  if (document.ownerType === "agency") return <span className="text-muted-foreground">Agency</span>;

  const name = document.ownerLabel ?? "—";
  const href = ownerHref(document);
  return (
    <span>
      <span className="text-muted-foreground">{typeLabel}: </span>
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
      <PageHeader title="Documents" description="Passports, visas, vouchers, and other files across your agency" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search by file name"
          aria-label="Search documents"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="max-w-sm flex-1"
        />
        <Select
          aria-label="Attached to"
          className="w-auto"
          value={ownerType}
          onChange={(event) => setOwnerType(event.target.value as OwnerTypeFilter)}
        >
          <option value="all">Attached to: all</option>
          {OWNER_TYPES.map((type) => (
            <option key={type} value={type}>
              {OWNER_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Document type"
          className="w-auto"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as DocumentTypeFilter)}
        >
          <option value="all">All types</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && documents.length === 0}
        loadingLabel="Loading documents"
        errorMessage="Something went wrong loading documents. Please try again later."
        emptyMessage={isFiltered ? "No documents match these filters" : "No documents yet"}
        emptyAction={
          !isFiltered ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/customers">Upload from a customer&apos;s profile</Link>
            </Button>
          ) : undefined
        }
        emptyIcon={<FileText size={20} />}
        size="page"
      >
        <Table aria-label="Documents" caption="All documents across your agency, newest first">
          <TableHeader>
            <TableRow className="text-muted-foreground">
              <TableCell header>File</TableCell>
              <TableCell header>Type</TableCell>
              <TableCell header>Attached to</TableCell>
              <TableCell header>Size</TableCell>
              <TableCell header>Uploaded</TableCell>
              <TableCell header>
                <span className="sr-only">Actions</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => {
              const isDeleting = deleteDocument.isPending && deleteDocument.variables?.id === document.id;
              return (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.fileName}</TableCell>
                  <TableCell>{DOCUMENT_TYPE_LABELS[document.documentType]}</TableCell>
                  <TableCell>
                    <AttachedTo document={document} />
                  </TableCell>
                  <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell>{formatDate(document.createdAt)}</TableCell>
                  <TableCell align="end">
                    <div className="flex items-center justify-end gap-1">
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
                        onClick={() => deleteDocument.mutate({ id: document.id })}
                        disabled={isDeleting}
                        aria-label={`Delete ${document.fileName}`}
                      >
                        {isDeleting ? "Deleting…" : "Delete"}
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
