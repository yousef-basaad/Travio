"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Document, DocumentType, OwnerType } from "@travio/api";
import { useSession } from "@travio/auth";
import { supabase } from "@/lib/supabase";

export const DOCUMENTS_QUERY_KEY = ["documents"];

function documentsQueryKey(ownerType: OwnerType, ownerId: string) {
  return [...DOCUMENTS_QUERY_KEY, ownerType, ownerId];
}

async function fetchDocuments(ownerType: OwnerType, ownerId: string): Promise<Document[]> {
  const response = await fetch(
    `/api/documents?ownerType=${ownerType}&ownerId=${encodeURIComponent(ownerId)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load documents (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/documents");
  }

  return data as Document[];
}

// Scoped to a single owner (customer/booking) - matches how this
// module is actually used (the Customer 360/Booking 360 Documents
// tabs), same shape as useInvoiceItems/useInvoicePayments being scoped
// to a single invoice.
export function useDocuments(ownerType: OwnerType, ownerId: string) {
  return useQuery({
    queryKey: documentsQueryKey(ownerType, ownerId),
    queryFn: () => fetchDocuments(ownerType, ownerId),
    enabled: Boolean(ownerId),
  });
}

async function createDocumentRecord(input: {
  ownerType: OwnerType;
  ownerId: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}): Promise<Document> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to save document (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/documents");
  }

  return data as Document;
}

// Uploads directly from the browser to Storage (the already-existing
// singleton browser client from @/lib/supabase, same one used for
// sign-in) using the caller's own session - Storage RLS
// (documents_bucket_tenant_select/_insert) enforces the tenant-prefixed
// path, no service_role anywhere in this flow. Only after the upload
// succeeds does this record the metadata row via POST /api/documents -
// the route independently re-validates that filePath is prefixed with
// the caller's own tenantId before trusting it.
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { profile } = useSession();

  return useMutation({
    mutationFn: async ({
      file,
      ownerType,
      ownerId,
      documentType,
    }: {
      file: File;
      ownerType: OwnerType;
      ownerId: string;
      documentType: DocumentType;
    }): Promise<Document> => {
      if (!profile?.tenantId) {
        throw new Error("No tenant context");
      }

      const documentId = crypto.randomUUID();
      const filePath = `${profile.tenantId}/${documentId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      return createDocumentRecord({
        ownerType,
        ownerId,
        documentType,
        fileName: file.name,
        filePath,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
    },
    onSuccess: (document) => {
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(document.ownerType, document.ownerId ?? ""),
      });
    },
  });
}

async function deleteDocument({ id }: { id: string; ownerType: OwnerType; ownerId: string }): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete document (${response.status})`);
  }
}

// Soft delete - the row's deleted_at is set server-side, the storage
// object is left in place (see the migration's own comment: storage
// cleanup is out of scope for this phase).
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(variables.ownerType, variables.ownerId),
      });
    },
  });
}

async function fetchSignedUrl(id: string): Promise<{ url: string; expiresIn: number }> {
  const response = await fetch(`/api/documents/${id}/signed-url`);

  if (!response.ok) {
    throw new Error(`Failed to get a preview link (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("url" in data)) {
    throw new Error("Unexpected response from /api/documents/:id/signed-url");
  }

  return data as { url: string; expiresIn: number };
}

// On-demand (not a background query) - a signed URL is only requested
// right when a user clicks Preview/Download, never prefetched or
// cached, since it expires in 60 seconds anyway.
export function useSignedUrl() {
  return useMutation({
    mutationFn: (id: string) => fetchSignedUrl(id),
  });
}
