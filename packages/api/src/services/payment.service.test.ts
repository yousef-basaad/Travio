import { describe, it, expect } from "vitest";
import { paymentService } from "./payment.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  findCallsByMethod,
  wasCalled,
} from "../test-utils/fake-supabase";

const PAYMENT_ROW = {
  id: "payment-1",
  tenant_id: "tenant-1",
  invoice_id: "invoice-1",
  amount: 500,
  method: "card",
  reference: "REF-1",
  paid_at: "2026-07-01T00:00:00.000Z",
  created_at: "2026-07-01T00:00:00.000Z",
};

describe("paymentService", () => {
  describe("getById (mapper behavior)", () => {
    it("maps a payment row to its camelCase domain shape", async () => {
      const { client } = createFakeSupabaseClient({
        payments: [{ data: PAYMENT_ROW, error: null }],
      });

      const payment = await paymentService.getById(client, "payment-1");

      expect(payment).toEqual({
        id: "payment-1",
        tenantId: "tenant-1",
        invoiceId: "invoice-1",
        amount: 500,
        method: "card",
        reference: "REF-1",
        paidAt: "2026-07-01T00:00:00.000Z",
        createdAt: "2026-07-01T00:00:00.000Z",
      });
    });
  });

  describe("list vs listByInvoice", () => {
    it("list() is tenant-wide (no invoice_id filter) and orders newest-first", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        payments: [{ data: [PAYMENT_ROW], error: null }],
      });

      await paymentService.list(client);

      const eqCalls = findCallsByMethod(allCalls, "payments", "eq");
      expect(eqCalls.some((call) => call.args[0] === "invoice_id")).toBe(false);

      const orderCalls = findCallsByMethod(allCalls, "payments", "order");
      expect(orderCalls).toContainEqual({
        method: "order",
        args: ["created_at", { ascending: false }],
      });
    });

    it("listByInvoice() filters by invoice_id and orders oldest-first (ledger order)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        payments: [{ data: [PAYMENT_ROW], error: null }],
      });

      await paymentService.listByInvoice(client, "invoice-1");

      const eqCalls = findCallsByMethod(allCalls, "payments", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["invoice_id", "invoice-1"] });

      const orderCalls = findCallsByMethod(allCalls, "payments", "order");
      expect(orderCalls).toContainEqual({
        method: "order",
        args: ["created_at", { ascending: true }],
      });
    });
  });

  describe("listByBooking", () => {
    it("collects the booking's invoice ids first, then filters payments by that set", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: [{ id: "invoice-1" }, { id: "invoice-2" }], error: null }],
        payments: [{ data: [PAYMENT_ROW], error: null }],
      });

      const payments = await paymentService.listByBooking(client, "booking-1");

      const invoiceEqCalls = findCallsByMethod(allCalls, "invoices", "eq");
      expect(invoiceEqCalls).toContainEqual({ method: "eq", args: ["booking_id", "booking-1"] });

      const paymentInCalls = findCallsByMethod(allCalls, "payments", "in");
      expect(paymentInCalls).toContainEqual({
        method: "in",
        args: ["invoice_id", ["invoice-1", "invoice-2"]],
      });

      expect(payments).toEqual([
        {
          id: "payment-1",
          tenantId: "tenant-1",
          invoiceId: "invoice-1",
          amount: 500,
          method: "card",
          reference: "REF-1",
          paidAt: "2026-07-01T00:00:00.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ]);
    });

    it("returns an empty array without querying payments when the booking has no invoices", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        invoices: [{ data: [], error: null }],
      });

      const payments = await paymentService.listByBooking(client, "booking-1");

      expect(payments).toEqual([]);
      expect(wasCalled(allCalls, "payments", "select")).toBe(false);
    });
  });

  describe("create", () => {
    it("stamps tenant_id and invoice_id on the insert row", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        payments: [{ data: PAYMENT_ROW, error: null }],
      });

      await paymentService.create(client, {
        tenantId: "tenant-1",
        invoiceId: "invoice-1",
        amount: 500,
        method: "card",
      });

      const [insertedRow] = getInsertedRows(allCalls, "payments") as Record<string, unknown>[];
      expect(insertedRow).toMatchObject({
        tenant_id: "tenant-1",
        invoice_id: "invoice-1",
        amount: 500,
        method: "card",
      });
    });
  });

  describe("delete", () => {
    it("issues a hard delete (payments has no deleted_at column)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        payments: [{ data: null, error: null }],
      });

      await paymentService.delete(client, "payment-1");

      expect(wasCalled(allCalls, "payments", "delete")).toBe(true);
    });
  });
});
