import type { Database } from "@travio/database";
import {
  documentTypeSchema,
  ownerTypeSchema,
  type DocumentType,
  type OwnerType,
} from "@travio/types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsertRow = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdateRow = Database["public"]["Tables"]["documents"]["Update"];

export type { DocumentType, OwnerType };

export interface Document {
  id: string;
  tenantId: string;
  ownerType: OwnerType;
  ownerId: string | null;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDocumentInput {
  tenantId: string;
  ownerType: OwnerType;
  ownerId?: string | null;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string | null;
}

export interface UpdateDocumentInput {
  ownerType?: OwnerType;
  ownerId?: string | null;
  documentType?: DocumentType;
  fileName?: string;
}

export function toDocument(row: DocumentRow): Document {
  // owner_type/document_type are text + CHECK, not real Postgres enums
  // (see the migration's own reasoning) - the generated Row type is
  // untyped string, so this validates against the same
  // ownerTypeSchema/documentTypeSchema every other layer (API/UI) uses,
  // rather than trusting the column as-is. Should be unreachable given
  // the CHECK constraints; fails loudly instead of silently lying about
  // the type to callers.
  const ownerType = ownerTypeSchema.parse(row.owner_type);
  const documentType = documentTypeSchema.parse(row.document_type);

  return {
    id: row.id,
    tenantId: row.tenant_id,
    ownerType,
    ownerId: row.owner_id,
    documentType,
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function toDocumentInsert(input: CreateDocumentInput): DocumentInsertRow {
  return {
    tenant_id: input.tenantId,
    owner_type: input.ownerType,
    owner_id: input.ownerId ?? null,
    document_type: input.documentType,
    file_name: input.fileName,
    file_path: input.filePath,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    uploaded_by: input.uploadedBy ?? null,
  };
}

export function toDocumentUpdate(input: UpdateDocumentInput): DocumentUpdateRow {
  return {
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    document_type: input.documentType,
    file_name: input.fileName,
  };
}
