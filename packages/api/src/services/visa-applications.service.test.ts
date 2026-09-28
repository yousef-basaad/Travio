import { describe, it, expect } from "vitest";
import { visaApplicationsService } from "./visa-applications.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  getUpdatedRows,
  findCallsByMethod,
  wasCalled,
} from "../test-utils/fake-supabase";

// Canned row for the notification side-effect visaApplicationsService
// triggers on create/status-change - notificationService's own mapper has
// a runtime "fail loudly if type is unrecognized" guard, so this must be
// a validly-shaped row, not `{}`, same reasoning as bookings.service.test.ts's
// NOTIFICATION_ROW.
const NOTIFICATION_ROW = {
  id: "notification-1",
  tenant_id: "tenant-1",
  user_id: "user-1",
  type: "visa_created",
  title: "Visa application created",
  message: "A new visa application was created.",
  metadata: {},
  read_at: null,
  created_at: "2026-07-01T00:00:00.000Z",
};

const VISA_ROW = {
  id: "visa-1",
  tenant_id: "tenant-1",
  customer_id: "customer-1",
  booking_id: null,
  assigned_to: null,
  country: "United Kingdom",
  visa_type: "tourist",
  status: "draft" as const,
  submitted_at: null,
  created_by: "user-1",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

describe("visaApplicationsService", () => {
  describe("mapper behavior", () => {
    it("maps a visa application row to its camelCase domain shape, including assignedTo", async () => {
      const { client } = createFakeSupabaseClient({
        visa_applications: [{ data: [{ ...VISA_ROW, assigned_to: "officer-1" }], error: null }],
      });

      const [visa] = await visaApplicationsService.listByCustomer(client, "customer-1");

      expect(visa).toMatchObject({
        id: "visa-1",
        customerId: "customer-1",
        assignedTo: "officer-1",
        country: "United Kingdom",
      });
    });
  });

  describe("listByCustomer / listByBooking - visa officer ownership scoping", () => {
    // The .or() clause here is service-layer defense-in-depth, not the
    // sole gate - visa_applications_tenant_access (RLS, Phase 4C.2)
    // already restricts a visa_officer's session to assigned-to-them-or-
    // unassigned rows at the database level; a fake Postgrest client
    // can't simulate that, so this only asserts the query the service
    // builds, same convention as invoice.service.test.ts's tenant-wide
    // comment.
    it("visa_officer's listByCustomer filters to assigned-to-them-or-unassigned", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: [VISA_ROW], error: null }],
      });

      await visaApplicationsService.listByCustomer(client, "customer-1", {
        role: "visa_officer",
        userId: "officer-1",
      });

      const orCalls = findCallsByMethod(allCalls, "visa_applications", "or");
      expect(orCalls).toContainEqual({
        method: "or",
        args: ["assigned_to.eq.officer-1,assigned_to.is.null"],
      });
    });

    it("visa_officer's listByBooking filters to assigned-to-them-or-unassigned", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: [VISA_ROW], error: null }],
      });

      await visaApplicationsService.listByBooking(client, "booking-1", {
        role: "visa_officer",
        userId: "officer-1",
      });

      const orCalls = findCallsByMethod(allCalls, "visa_applications", "or");
      expect(orCalls).toContainEqual({
        method: "or",
        args: ["assigned_to.eq.officer-1,assigned_to.is.null"],
      });
    });

    it("does not apply the ownership filter for non-visa_officer roles (e.g. travio_admin)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: [VISA_ROW], error: null }],
      });

      await visaApplicationsService.listByCustomer(client, "customer-1", {
        role: "travio_admin",
        userId: "admin-1",
      });

      expect(wasCalled(allCalls, "visa_applications", "or")).toBe(false);
    });

    it("does not apply the ownership filter when no options are passed (existing callers)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: [VISA_ROW], error: null }],
      });

      await visaApplicationsService.listByCustomer(client, "customer-1");

      expect(wasCalled(allCalls, "visa_applications", "or")).toBe(false);
    });
  });

  describe("create", () => {
    it("stamps tenant_id/customer_id and preserves assignedTo on the insert row", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: { ...VISA_ROW, assigned_to: "officer-1" }, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await visaApplicationsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        assignedTo: "officer-1",
        country: "United Kingdom",
        createdBy: "user-1",
      });

      const [insertedRow] = getInsertedRows(allCalls, "visa_applications") as Record<
        string,
        unknown
      >[];
      expect(insertedRow).toMatchObject({
        tenant_id: "tenant-1",
        customer_id: "customer-1",
        assigned_to: "officer-1",
      });
    });

    it("still raises a visa_created notification for whoever created it (unchanged)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [{ data: VISA_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await visaApplicationsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        createdBy: "user-1",
      });

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(notification).toMatchObject({
        tenant_id: "tenant-1",
        user_id: "user-1",
        type: "visa_created",
      });
    });
  });

  describe("update", () => {
    it("preserves assigned_to on the update row when provided", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [
          { data: { status: "draft" }, error: null },
          { data: { ...VISA_ROW, assigned_to: "officer-2" }, error: null },
        ],
      });

      await visaApplicationsService.update(client, "visa-1", { assignedTo: "officer-2" });

      const [updatedRow] = getUpdatedRows(allCalls, "visa_applications") as Record<
        string,
        unknown
      >[];
      expect(updatedRow?.assigned_to).toBe("officer-2");
    });

    it("still raises a visa_status_changed notification only when status actually differs (unchanged)", async () => {
      const updatedRow = { ...VISA_ROW, status: "submitted" as const };
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [
          { data: { status: "draft" }, error: null },
          { data: updatedRow, error: null },
        ],
        notifications: [
          { data: { ...NOTIFICATION_ROW, type: "visa_status_changed" }, error: null },
        ],
      });

      await visaApplicationsService.update(client, "visa-1", { status: "submitted" });

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(notification).toMatchObject({ type: "visa_status_changed", user_id: "user-1" });
    });

    it("does not raise a notification when status is unchanged (unchanged)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        visa_applications: [
          { data: { status: "draft" }, error: null },
          { data: VISA_ROW, error: null },
        ],
      });

      await visaApplicationsService.update(client, "visa-1", { country: "France" });

      expect(wasCalled(allCalls, "notifications", "insert")).toBe(false);
    });
  });
});
