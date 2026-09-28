import { describe, it, expect } from "vitest";
import { invoiceService } from "./invoice.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  getUpdatedRows,
  findCallsByMethod,
} from "../test-utils/fake-supabase";

const INVOICE_ROW = {
  id: "invoice-1",
  tenant_id: "tenant-1",
  customer_id: "customer-1",
  booking_id: null,
  invoice_number: "INV-1001",
  status: "draft",
  subtotal: 1000,
  tax: 150,
  total: 1150,
  currency: "SAR",
  issue_date: "2026-07-01",
  due_date: "2026-07-15",
  notes: null,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
  deleted_at: null,
};

describe("invoiceService", () => {
  describe("getById (mapper behavior)", () => {
    it("maps an invoice row to its camelCase domain shape", async () => {
      const { client } = createFakeSupabaseClient({
        invoices: [{ data: INVOICE_ROW, error: null }],
      });

      const invoice = await invoiceService.getById(client, "invoice-1");

      expect(invoice).toEqual({
        id: "invoice-1",
        tenantId: "tenant-1",
        customerId: "customer-1",
        bookingId: null,
        invoiceNumber: "INV-1001",
        status: "draft",
        subtotal: 1000,
        tax: 150,
        total: 1150,
        currency: "SAR",
        issueDate: "2026-07-01",
        dueDate: "2026-07-15",
        notes: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
        deletedAt: null,
      });
    });
  });

  describe("list / listByCustomer / listByBooking", () => {
    it("list() excludes soft-deleted rows and applies no customer/booking filter", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: [INVOICE_ROW], error: null }],
      });

      await invoiceService.list(client);

      const isCalls = findCallsByMethod(allCalls, "invoices", "is");
      expect(isCalls).toContainEqual({ method: "is", args: ["deleted_at", null] });
      // Tenant-wide - RLS (tenant_id = current_tenant_id()) is what scopes
      // this, not an explicit .eq("tenant_id", ...) here.
      const eqCalls = findCallsByMethod(allCalls, "invoices", "eq");
      expect(eqCalls.some((call) => call.args[0] === "tenant_id")).toBe(false);
    });

    it("listByCustomer() filters by customer_id in addition to excluding deleted rows", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: [INVOICE_ROW], error: null }],
      });

      await invoiceService.listByCustomer(client, "customer-1");

      const eqCalls = findCallsByMethod(allCalls, "invoices", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["customer_id", "customer-1"] });
    });

    it("listByBooking() filters by booking_id", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: [INVOICE_ROW], error: null }],
      });

      await invoiceService.listByBooking(client, "booking-1");

      const eqCalls = findCallsByMethod(allCalls, "invoices", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["booking_id", "booking-1"] });
    });
  });

  describe("create", () => {
    it("stamps tenant_id on the insert row (the RLS insert-check assumption)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: INVOICE_ROW, error: null }],
      });

      await invoiceService.create(client, {
        tenantId: "tenant-1",
        invoiceNumber: "INV-1001",
        total: 1150,
      });

      const [insertedRow] = getInsertedRows(allCalls, "invoices") as Record<string, unknown>[];
      expect(insertedRow).toMatchObject({ tenant_id: "tenant-1", invoice_number: "INV-1001" });
    });
  });

  describe("softDelete / restore", () => {
    it("softDelete() sets deleted_at to a timestamp, not a hard delete", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: { ...INVOICE_ROW, deleted_at: "2026-07-29T00:00:00.000Z" }, error: null }],
      });

      await invoiceService.softDelete(client, "invoice-1");

      const [updatedRow] = getUpdatedRows(allCalls, "invoices") as Record<string, unknown>[];
      expect(updatedRow?.deleted_at).toEqual(expect.any(String));
    });

    it("restore() sets deleted_at back to null", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: INVOICE_ROW, error: null }],
      });

      await invoiceService.restore(client, "invoice-1");

      const [updatedRow] = getUpdatedRows(allCalls, "invoices") as Record<string, unknown>[];
      expect(updatedRow?.deleted_at).toBeNull();
    });
  });
});
