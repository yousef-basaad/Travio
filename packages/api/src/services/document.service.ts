import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { DocumentType, OwnerType } from "@travio/types";
import {
  toDocument,
  toDocumentInsert,
  toDocumentUpdate,
  type Document,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "./document.mapper";
import { notificationService } from "./notification.service";
import { ilikeAny, toRange, RANGE_NOT_SATISFIABLE, type Page, type PageRequest } from "./pagination";

export interface ListDocumentsFilter {
  ownerType?: OwnerType;
  ownerId?: string;
}

export interface DocumentPageRequest extends PageRequest {
  ownerType?: OwnerType;
  documentType?: DocumentType;
}

// A Documents workspace row: the document plus a readable name for what
// it's attached to (customer name, booking number/title, invoice number).
// null for agency-level documents, or when RLS hides the owner.
export type DocumentListItem = Document & { ownerLabel: string | null };

type DocumentClient = SupabaseClient<Database>;

// Names for the owners of one page of documents. owner_id is polymorphic
// (no foreign key to embed), so this looks up only the ids on the page:
// at most one small query per owner type, all through the caller's own
// RLS-scoped client.
async function ownerLabels(supabase: DocumentClient, documents: Document[]): Promise<Map<string, string>> {
  const idsOf = (type: OwnerType) => [
    ...new Set(documents.filter((d) => d.ownerType === type && d.ownerId).map((d) => d.ownerId as string)),
  ];
  const customerIds = idsOf("customer");
  const bookingIds = idsOf("booking");
  const invoiceIds = idsOf("invoice");
  const labels = new Map<string, string>();

  const [customers, bookings, invoices] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id, full_name").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    bookingIds.length
      ? supabase.from("bookings").select("id, booking_number, title").in("id", bookingIds)
      : Promise.resolve({ data: [], error: null }),
    invoiceIds.length
      ? supabase.from("invoices").select("id, invoice_number").in("id", invoiceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (customers.error) throw customers.error;
  if (bookings.error) throw bookings.error;
  if (invoices.error) throw invoices.error;

  for (const row of customers.data ?? []) labels.set(`customer:${row.id}`, row.full_name);
  for (const row of bookings.data ?? []) labels.set(`booking:${row.id}`, `${row.booking_number} · ${row.title}`);
  for (const row of invoices.data ?? []) labels.set(`invoice:${row.id}`, row.invoice_number);
  return labels;
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

  // One page of the tenant's documents, newest first: filterable by owner
  // type and document type, searchable by file name. RLS decides which
  // documents (and owner names) the caller can see.
  async listPage(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    request: DocumentPageRequest,
  ): Promise<Page<DocumentListItem>> {
    // head: true -> count only (used when the page is past the end).
    const filtered = (head: boolean) => {
      let query = supabase
        .from("documents")
        .select("*", { count: "exact", head })
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      if (request.ownerType) {
        query = query.eq("owner_type", request.ownerType);
      }
      if (request.documentType) {
        query = query.eq("document_type", request.documentType);
      }
      if (request.search) {
        query = query.or(ilikeAny(["file_name"], request.search));
      }
      return query;
    };

    const [from, to] = toRange(request);
    const { data, count, error } = await filtered(false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (error?.code === RANGE_NOT_SATISFIABLE) {
      const { count: total, error: countError } = await filtered(true);
      if (countError) throw countError;
      return { items: [], total: total ?? 0, page: request.page, pageSize: request.pageSize };
    }
    if (error) throw error;

    const documents = data.map(toDocument);
    const labels = await ownerLabels(supabase, documents);
    return {
      items: documents.map((document) => ({
        ...document,
        ownerLabel: document.ownerId ? (labels.get(`${document.ownerType}:${document.ownerId}`) ?? null) : null,
      })),
      total: count ?? 0,
      page: request.page,
      pageSize: request.pageSize,
    };
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
