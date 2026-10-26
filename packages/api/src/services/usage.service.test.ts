import { describe, it, expect } from "vitest";
import { usageService } from "./usage.service";
import { createFakeSupabaseClient, wasCalled } from "../test-utils/fake-supabase";

describe("usageService.getSnapshot", () => {
  it("takes the document count and storage bytes from usage_document_totals, never from document rows", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      profiles: [{ data: null, count: 4, error: null } as never],
      customers: [{ data: null, count: 12, error: null } as never],
      bookings: [{ data: null, count: 9, error: null } as never],
      "rpc:usage_document_totals": [
        { data: [{ document_count: 1500, storage_bytes: 52428800 }], error: null },
      ],
    });

    const snapshot = await usageService.getSnapshot(client, "tenant-1");

    expect(snapshot).toEqual({
      teamMembers: 4,
      customers: 12,
      bookingsThisMonth: 9,
      documents: 1500,
      storageBytes: 52428800,
    });
    expect(wasCalled(allCalls, "documents", "select")).toBe(false);
  });

  it("treats an empty totals result as zero", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:usage_document_totals": [{ data: [], error: null }],
    });

    const snapshot = await usageService.getSnapshot(client, "tenant-1");
    expect(snapshot).toMatchObject({ documents: 0, storageBytes: 0 });
  });
});
