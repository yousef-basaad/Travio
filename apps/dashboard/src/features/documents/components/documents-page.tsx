"use client";

import { useState } from "react";
import { Button, PageHeader } from "@travio/ui";
import type { OwnerType } from "@travio/api";
import { useDocuments } from "../api/documents.api";
import { DocumentTable } from "./document-table";
import { DocumentFilters, type DocumentTypeFilter } from "./document-filters";
import { UploadDocumentDialog } from "./upload-document-dialog";

export interface DocumentsPageProps {
  ownerType: OwnerType;
  ownerId: string;
}

// Parameterized by owner (customer/booking), not a routed page - this
// is what the Customer 360/Booking 360 "Documents" tabs render directly
// as their tab content, same dual-context shape as InvoiceList's
// customerId/bookingId props. No standalone /documents route exists yet
// (no sidebar nav slot for one either) - out of this phase's scope.
export function DocumentsPage({ ownerType, ownerId }: DocumentsPageProps) {
  const { data: documents, isLoading, isError } = useDocuments(ownerType, ownerId);
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Passports, visas, vouchers, and other attached files"
        actions={
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            Upload Document
          </Button>
        }
      />

      <DocumentFilters value={typeFilter} onChange={setTypeFilter} />

      <DocumentTable
        documents={documents}
        isLoading={isLoading}
        isError={isError}
        ownerType={ownerType}
        ownerId={ownerId}
        typeFilter={typeFilter}
        onUploadClick={() => setIsUploadOpen(true)}
      />

      <UploadDocumentDialog
        ownerType={ownerType}
        ownerId={ownerId}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </div>
  );
}
