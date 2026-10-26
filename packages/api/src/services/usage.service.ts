import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { startOfMonth } from "./analytics.service";

export interface TenantUsageSnapshot {
  teamMembers: number;
  customers: number;
  bookingsThisMonth: number;
  documents: number;
  storageBytes: number;
}

// Aggregation-only service - no single table this maps 1:1, so (like
// analyticsService) there's no companion *.mapper.ts. Every count is
// calculated live from the caller's own RLS-scoped session client
// (never service_role) - tenant_usage (the pre-existing, unused table)
// is deliberately not read from or written to here; Product-7's design
// prefers a live calculation over a duplicated counter that could drift
// stale with no job runner to keep it in sync.
export const usageService = {
  async getSnapshot(
    supabase: SupabaseClient<Database>,
    tenantId: string,
  ): Promise<TenantUsageSnapshot> {
    const thisMonthStart = startOfMonth(0);

    const [teamMembersResult, customersResult, bookingsResult, documentsResult] =
      await Promise.all([
        // Customer profiles never carry a tenant_id (Product-5), so this
        // count already excludes them without any extra role filter -
        // same query teamMembersService.listByTenant uses, just a head
        // count instead of full rows.
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", thisMonthStart),
        // Count and byte sum computed in Postgres (usage_document_totals,
        // 20261027120000) - summing selected rows here was capped at
        // max_rows (1000). SECURITY INVOKER, so RLS still applies.
        supabase.rpc("usage_document_totals"),
      ]);

    if (teamMembersResult.error) throw teamMembersResult.error;
    if (customersResult.error) throw customersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const documentTotals = documentsResult.data[0];

    return {
      teamMembers: teamMembersResult.count ?? 0,
      customers: customersResult.count ?? 0,
      bookingsThisMonth: bookingsResult.count ?? 0,
      documents: Number(documentTotals?.document_count ?? 0),
      storageBytes: Number(documentTotals?.storage_bytes ?? 0),
    };
  },
};
