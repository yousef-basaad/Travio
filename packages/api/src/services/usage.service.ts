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
        // file_size is only summed for documents, not counted with head:
        // true - the row count and the byte sum both come out of the
        // same bounded select, matching analyticsService's own "aggregate
        // in JS after a bounded select" convention (see its own comment).
        supabase.from("documents").select("file_size").is("deleted_at", null),
      ]);

    if (teamMembersResult.error) throw teamMembersResult.error;
    if (customersResult.error) throw customersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const storageBytes = documentsResult.data.reduce((sum, row) => sum + row.file_size, 0);

    return {
      teamMembers: teamMembersResult.count ?? 0,
      customers: customersResult.count ?? 0,
      bookingsThisMonth: bookingsResult.count ?? 0,
      documents: documentsResult.data.length,
      storageBytes,
    };
  },
};
