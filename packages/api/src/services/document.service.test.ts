import { describe, it, expect } from "vitest";
import { documentService } from "./document.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  findCallsByMethod,
  wasCalled,
} from "../test-utils/fake-supabase";

const DOCUMENT_ROW = {
  id: "document-1",
  tenant_id: "tenant-1",
  owner_type: "customer",
  owner_id: "customer-1",
  document_type: "passport",
  file_name: "passport.pdf",
  file_path: "tenant-1/document-1/passport.pdf",
  mime_type: "application/pdf",
  file_size: 1024,
  uploaded_by: "user-1",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
  deleted_at: null,
};

const NOTIFICATION_ROW = {
  id: "notification-1",
  tenant_id: "tenant-1",
  user_id: "user-1",
  type: "document_uploaded",
  title: "Document uploaded",
  message: "passport.pdf was uploaded.",
  metadata: {},
  read_at: null,
  created_at: "2026-07-01T00:00:00.000Z",
};

describe("documentService", () => {
  describe("mapper behavior", () => {
    it("maps a document row to its camelCase domain shape", async () => {
      const { client } = createFakeSupabaseClient({
        documents: [{ data: DOCUMENT_ROW, error: null }],
      });

      const document = await documentService.getById(client, "document-1");

      expect(document).toEqual({
        id: "document-1",
        tenantId: "tenant-1",
        ownerType: "customer",
        ownerId: "customer-1",
        documentType: "passport",
        fileName: "passport.pdf",
        filePath: "tenant-1/document-1/passport.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        uploadedBy: "user-1",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
        deletedAt: null,
      });
    });

    it("throws rather than silently accepting an unrecognized owner_type/document_type", async () => {
      const { client } = createFakeSupabaseClient({
        documents: [{ data: { ...DOCUMENT_ROW, owner_type: "not_a_real_type" }, error: null }],
      });

      await expect(documentService.getById(client, "document-1")).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("always excludes soft-deleted rows", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: [DOCUMENT_ROW], error: null }],
      });

      await documentService.list(client);

      expect(findCallsByMethod(allCalls, "documents", "is")).toContainEqual({
        method: "is",
        args: ["deleted_at", null],
      });
    });

    it("applies ownerType/ownerId filters only when provided", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: [DOCUMENT_ROW], error: null }],
      });

      await documentService.list(client, { ownerType: "customer", ownerId: "customer-1" });

      const eqCalls = findCallsByMethod(allCalls, "documents", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["owner_type", "customer"] });
      expect(eqCalls).toContainEqual({ method: "eq", args: ["owner_id", "customer-1"] });
    });

    it("omits owner filters entirely when no filter is given (unscoped list)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: [DOCUMENT_ROW], error: null }],
      });

      await documentService.list(client);

      const eqCalls = findCallsByMethod(allCalls, "documents", "eq");
      expect(eqCalls).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("stamps tenant_id on the insert row", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: DOCUMENT_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await documentService.create(client, {
        tenantId: "tenant-1",
        ownerType: "customer",
        ownerId: "customer-1",
        documentType: "passport",
        fileName: "passport.pdf",
        filePath: "tenant-1/document-1/passport.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        uploadedBy: "user-1",
      });

      const [insertedRow] = getInsertedRows(allCalls, "documents") as Record<string, unknown>[];
      expect(insertedRow).toMatchObject({ tenant_id: "tenant-1" });
    });

    it("notifies the uploader when uploadedBy is set", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: DOCUMENT_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await documentService.create(client, {
        tenantId: "tenant-1",
        ownerType: "customer",
        ownerId: "customer-1",
        documentType: "passport",
        fileName: "passport.pdf",
        filePath: "tenant-1/document-1/passport.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        uploadedBy: "user-1",
      });

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(notification).toMatchObject({ type: "document_uploaded", user_id: "user-1" });
    });

    it("does not fabricate a notification recipient when uploadedBy is absent", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: { ...DOCUMENT_ROW, uploaded_by: null }, error: null }],
      });

      await documentService.create(client, {
        tenantId: "tenant-1",
        ownerType: "customer",
        ownerId: "customer-1",
        documentType: "passport",
        fileName: "passport.pdf",
        filePath: "tenant-1/document-1/passport.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      });

      expect(wasCalled(allCalls, "notifications", "insert")).toBe(false);
    });
  });

  describe("softDelete", () => {
    it("sets deleted_at and notifies the uploader (document_deleted)", async () => {
      const deletedRow = { ...DOCUMENT_ROW, deleted_at: "2026-07-29T00:00:00.000Z" };
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: deletedRow, error: null }],
        notifications: [{ data: { ...NOTIFICATION_ROW, type: "document_deleted" }, error: null }],
      });

      await documentService.softDelete(client, "document-1");

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(notification).toMatchObject({ type: "document_deleted", user_id: "user-1" });
    });

    it("never issues a hard delete or storage cleanup call (soft delete only, this phase)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        documents: [{ data: { ...DOCUMENT_ROW, deleted_at: "2026-07-29T00:00:00.000Z" }, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await documentService.softDelete(client, "document-1");

      expect(wasCalled(allCalls, "documents", "delete")).toBe(false);
    });
  });
});
