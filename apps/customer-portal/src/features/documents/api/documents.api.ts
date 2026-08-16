"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { Document } from "@travio/api";

export const DOCUMENTS_QUERY_KEY = ["documents"];

async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch("/api/documents");

  if (!response.ok) {
    throw new Error(`Failed to load documents (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/documents");
  }

  return data as Document[];
}

// No ownerType/ownerId params - unlike the dashboard's per-owner-tab
// useDocuments, this is the customer's single, whole-portfolio document
// list; documents_customer_access RLS (Product-6 migration) is what
// scopes the result to their own documents (customer + their bookings +
// their invoices) in one query.
export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: fetchDocuments,
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

// On-demand mutation, not a background query - mirrors the dashboard's
// own useSignedUrl exactly, a signed URL expires in 60s so it's only
// ever requested right when Preview/Download is clicked.
export function useSignedUrl() {
  return useMutation({
    mutationFn: (id: string) => fetchSignedUrl(id),
  });
}
