import { z } from "zod";
import { documentTypeSchema, ownerTypeSchema } from "@travio/types";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

// tenantId/uploadedBy are intentionally absent - resolved from the
// authenticated session, never trusted from the request body. filePath
// is trusted here only because it's re-validated below (the route
// checks it starts with the caller's own tenant_id segment) - the
// client uploads directly to Storage first, then this just records the
// metadata, so the path already exists by the time this runs.
export const createDocumentSchema = z
  .object({
    ownerType: ownerTypeSchema,
    ownerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    documentType: documentTypeSchema,
    fileName: z.string().trim().min(1, "File name is required"),
    filePath: z.string().trim().min(1, "File path is required"),
    mimeType: z.string().trim().min(1, "MIME type is required"),
    fileSize: z.number().positive(),
  })
  .refine((value) => value.ownerType === "agency" || Boolean(value.ownerId), {
    message: "ownerId is required unless ownerType is 'agency'",
    path: ["ownerId"],
  });

// Unlike create, update only ever touches metadata (never the file
// itself - re-uploading means deleting and creating a new document
// record) - documentType/ownerType/ownerId can be corrected after the
// fact, fileName can be renamed.
export const updateDocumentSchema = z.object({
  ownerType: z.preprocess(emptyToUndefined, ownerTypeSchema.optional()),
  ownerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  documentType: z.preprocess(emptyToUndefined, documentTypeSchema.optional()),
  fileName: z.string().trim().min(1, "File name is required").optional(),
});
