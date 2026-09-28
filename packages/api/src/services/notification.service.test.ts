import { describe, it, expect } from "vitest";
import { notificationService } from "./notification.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  getUpdatedRows,
  findCallsByMethod,
} from "../test-utils/fake-supabase";

const NOTIFICATION_ROW = {
  id: "notification-1",
  tenant_id: "tenant-1",
  user_id: "user-1",
  type: "booking_created",
  title: "Booking created",
  message: "Booking BK-1001 was created.",
  metadata: { bookingId: "booking-1" },
  read_at: null,
  created_at: "2026-07-01T00:00:00.000Z",
};

describe("notificationService", () => {
  describe("mapper behavior", () => {
    it("maps a notification row to its camelCase domain shape, defaulting metadata to {}", async () => {
      const rowWithNullMetadata = { ...NOTIFICATION_ROW, metadata: null };
      const { client } = createFakeSupabaseClient({
        notifications: [{ data: rowWithNullMetadata, error: null }],
      });

      const notification = await notificationService.getById(client, "notification-1");

      expect(notification).toEqual({
        id: "notification-1",
        tenantId: "tenant-1",
        userId: "user-1",
        type: "booking_created",
        title: "Booking created",
        message: "Booking BK-1001 was created.",
        metadata: {},
        readAt: null,
        createdAt: "2026-07-01T00:00:00.000Z",
      });
    });

    it("throws rather than silently accepting an unrecognized type", async () => {
      const { client } = createFakeSupabaseClient({
        notifications: [{ data: { ...NOTIFICATION_ROW, type: "not_a_real_type" }, error: null }],
      });

      await expect(notificationService.getById(client, "notification-1")).rejects.toThrow();
    });
  });

  describe("listByUser", () => {
    it("scopes to the given user, newest first, capped at 50", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        notifications: [{ data: [NOTIFICATION_ROW], error: null }],
      });

      await notificationService.listByUser(client, "user-1");

      const eqCalls = findCallsByMethod(allCalls, "notifications", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["user_id", "user-1"] });

      const orderCalls = findCallsByMethod(allCalls, "notifications", "order");
      expect(orderCalls).toContainEqual({
        method: "order",
        args: ["created_at", { ascending: false }],
      });

      const limitCalls = findCallsByMethod(allCalls, "notifications", "limit");
      expect(limitCalls).toContainEqual({ method: "limit", args: [50] });
    });
  });

  describe("create", () => {
    it("stamps tenant_id and user_id on the insert row (the RLS insert-check assumption)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await notificationService.create(client, {
        tenantId: "tenant-1",
        userId: "user-1",
        type: "booking_created",
        title: "Booking created",
        message: "Booking BK-1001 was created.",
        metadata: { bookingId: "booking-1" },
      });

      const [insertedRow] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(insertedRow).toMatchObject({
        tenant_id: "tenant-1",
        user_id: "user-1",
        type: "booking_created",
      });
    });
  });

  describe("markRead / markAllRead", () => {
    it("markRead() sets read_at to a timestamp", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        notifications: [{ data: { ...NOTIFICATION_ROW, read_at: "2026-07-29T00:00:00.000Z" }, error: null }],
      });

      await notificationService.markRead(client, "notification-1");

      const [updatedRow] = getUpdatedRows(allCalls, "notifications") as Record<string, unknown>[];
      expect(updatedRow?.read_at).toEqual(expect.any(String));
    });

    it("markAllRead() scopes to the user AND only touches still-unread rows", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        notifications: [{ data: null, error: null }],
      });

      await notificationService.markAllRead(client, "user-1");

      const eqCalls = findCallsByMethod(allCalls, "notifications", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["user_id", "user-1"] });

      const isCalls = findCallsByMethod(allCalls, "notifications", "is");
      expect(isCalls).toContainEqual({ method: "is", args: ["read_at", null] });
    });
  });
});
