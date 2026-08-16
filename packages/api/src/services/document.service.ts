import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { OwnerType } from "@travio/types";
import {
  toDocument,
  toDocumentInsert,
  toDocumentUpdate,
  type Document,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "./document.mapper";
import { notificationService } from "./notification.service";

export interface ListDocumentsFilter {
  ownerType?: OwnerType;
  ownerId?: string;
}

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors invoiceService's soft-delete shape -
// callers only ever see the mapped Document domain shape, never the
// generated Row type. Storage object cleanup is deliberately not part
// of this service - soft delete only, per explicit direction for this
// phase.
export const documentService = {
  // One method, optionally filtered - used both for a single owner's
  // tab (ownerType+ownerId both set) and would support an unscoped
  // tenant-wide list later without a second method.
  async list(
    supabase: SupabaseClient<Database>,
    filter: ListDocumentsFilter = {},
  ): Promise<Document[]> {
    let query = supabase.from("documents").select("*").is("deleted_at", null);

    if (filter.ownerType) {
      query = query.eq("owner_type", filter.ownerType);
    }
    if (filter.ownerId) {
      query = query.eq("owner_id", filter.ownerId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toDocument);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? toDocument(data) : null;
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateDocumentInput,
  ): Promise<Document> {
    const { data, error } = await supabase
      .from("documents")
      .insert(toDocumentInsert(input))
      .select()
      .single();

    if (error) throw error;
    const document = toDocument(data);

    // Notify whoever uploaded the file - uploadedBy is nullable
    // (on delete set null), so this is skipped rather than guessing a
    // recipient.
    if (document.uploadedBy) {
      await notificationService.create(supabase, {
        tenantId: document.tenantId,
        userId: document.uploadedBy,
        type: "document_uploaded",
        title: "Document uploaded",
        message: `${document.fileName} was uploaded.`,
        metadata: { documentId: document.id, documentType: document.documentType },
      });
    }

    return document;
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateDocumentInput,
  ): Promise<Document> {
    const { data, error } = await supabase
      .from("documents")
      .update(toDocumentUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toDocument(data);
  },

  async softDelete(supabase: SupabaseClient<Database>, id: string): Promise<Document> {
    const { data, error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const document = toDocument(data);

    if (document.uploadedBy) {
      await notificationService.create(supabase, {
        tenantId: document.tenantId,
        userId: document.uploadedBy,
        type: "document_deleted",
        title: "Document deleted",
        message: `${document.fileName} was deleted.`,
        metadata: { documentId: document.id, documentType: document.documentType },
      });
    }

    return document;
  },
};
