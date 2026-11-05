import { describe, it, expect } from "vitest";
import { visaApplicationsService, toVisaCenterStats } from "./visa-applications.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// The counting itself is covered by supabase/tests/visa_center_stats.test.sql.
describe("visa center stats", () => {
  it("maps the database function's jsonb", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:visa_center_stats": [
        {
          data: {
            total: 12,
            draft: 2,
            submitted: 5,
            approved: 4,
            rejected: 1,
            new_this_month: 6,
            new_last_month: 3,
            by_type: [{ label: "سياحية", count: 7 }],
            by_country: [{ label: "تركيا", count: 5 }],
          },
          error: null,
        },
      ],
    });

    await expect(visaApplicationsService.getCenterStats(client)).resolves.toEqual({
      total: 12,
      byStatus: { draft: 2, submitted: 5, approved: 4, rejected: 1 },
      newThisMonth: 6,
      newLastMonth: 3,
      byType: [{ label: "سياحية", count: 7 }],
      byCountry: [{ label: "تركيا", count: 5 }],
    });
    expect(findCallsByMethod(allCalls, "rpc:visa_center_stats", "rpc")).toHaveLength(1);
  });

  it("reads anything missing or malformed as zero / empty", () => {
    expect(toVisaCenterStats(null)).toEqual({
      total: 0,
      byStatus: { draft: 0, submitted: 0, approved: 0, rejected: 0 },
      newThisMonth: 0,
      newLastMonth: 0,
      byType: [],
      byCountry: [],
    });
    expect(toVisaCenterStats({ total: "x", by_type: [{ label: "", count: 1 }, "bad"] }).byType).toEqual([]);
  });
});
