import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import {
  toVisaApplication,
  toVisaApplicationWithCustomer,
  toVisaApplicationInsert,
  toVisaApplicationUpdate,
  type VisaApplication,
  type VisaApplicationWithCustomer,
  type VisaStatus,
  type CreateVisaApplicationInput,
  type UpdateVisaApplicationInput,
} from "./visa-applications.mapper";
import { notificationService } from "./notification.service";
import type { Page, PageRequest } from "./pagination";

export interface ListVisaApplicationsOptions {
  role: UserRole;
  userId: string;
}

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingFlightsService/bookingHotelsService/
// bookingTransfersService's shape - callers only ever see the mapped
// VisaApplication domain shape, never the generated Row type.
export interface VisaCenterStats {
  total: number;
  byStatus: Record<VisaStatus, number>;
  newThisMonth: number;
  newLastMonth: number;
  byType: { label: string; count: number }[];
  byCountry: { label: string; count: number }[];
}

function toCount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toLabelCounts(value: unknown): { label: string; count: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { label: unknown; count: unknown } => typeof item === "object" && item !== null)
    .map((item) => ({ label: String(item.label ?? ""), count: toCount(item.count) }))
    .filter((item) => item.label !== "");
}

// The function returns jsonb; anything missing reads as zero/empty.
export function toVisaCenterStats(data: unknown): VisaCenterStats {
  const raw = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  return {
    total: toCount(raw.total),
    byStatus: {
      draft: toCount(raw.draft),
      submitted: toCount(raw.submitted),
      approved: toCount(raw.approved),
      rejected: toCount(raw.rejected),
    },
    newThisMonth: toCount(raw.new_this_month),
    newLastMonth: toCount(raw.new_last_month),
    byType: toLabelCounts(raw.by_type),
    byCountry: toLabelCounts(raw.by_country),
  };
}

export const visaApplicationsService = {
  // The sales_agent .or() convention (Phase 4C.1's customer/crm-leads/
  // bookings services) is mirrored here for visa_officer - it's
  // defense-in-depth, not the sole gate: visa_applications_tenant_access
  // (RLS, Phase 4C.2) already restricts a visa_officer's session to
  // assigned-to-them-or-unassigned rows.
  // The visa workspace: every visa application in the tenant the caller
  // may see, newest first, with the customer's name. Which rows come back
  // is decided by RLS (20261026120000/20261026130000): managers see all,
  // a visa officer its own + unassigned, a sales agent those of customers
  // it can see. The tenant .eq() is defense-in-depth, same as list().
  // The Visa Center's numbers (visa_center_stats, 20261105160000):
  // counts per status, new this/last month, top visa types and countries.
  // Counted in Postgres under the caller's RLS.
  async getCenterStats(supabase: SupabaseClient<Database>): Promise<VisaCenterStats> {
    const { data, error } = await supabase.rpc("visa_center_stats");
    if (error) throw error;
    return toVisaCenterStats(data);
  },

  // One page of the Visa Center (visa_workspace_page, 20261110140000),
  // searched and filtered in Postgres under the caller's RLS.
  async listPage(
    supabase: SupabaseClient<Database>,
    request: PageRequest & { status?: VisaStatus },
  ): Promise<Page<VisaApplicationWithCustomer>> {
    const { data, error } = await supabase.rpc("visa_workspace_page", {
      search_text: request.search ?? "",
      status_filter: request.status,
      page_number: request.page,
      page_size: request.pageSize,
    });
    if (error) throw error;
    const raw = (typeof data === "object" && data !== null ? data : {}) as { total?: unknown; items?: unknown };
    const rows = (Array.isArray(raw.items) ? raw.items : []) as Parameters<typeof toVisaApplicationWithCustomer>[0][];
    return {
      items: rows.map(toVisaApplicationWithCustomer),
      total: Number(raw.total ?? 0),
      page: request.page,
      pageSize: request.pageSize,
    };
  },

  async listForTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
  ): Promise<VisaApplicationWithCustomer[]> {
    const { data, error } = await supabase
      .from("visa_applications")
      .select("*, customer:customers(id, full_name), booking:bookings(start_date)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toVisaApplicationWithCustomer);
  },

  async listByCustomer(
    supabase: SupabaseClient<Database>,
    customerId: string,
    options?: ListVisaApplicationsOptions,
  ): Promise<VisaApplication[]> {
    let query = supabase
      .from("visa_applications")
      .select("*")
      .eq("customer_id", customerId);

    if (options?.role === "visa_officer") {
      query = query.or(`assigned_to.eq.${options.userId},assigned_to.is.null`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toVisaApplication);
  },

  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
    options?: ListVisaApplicationsOptions,
  ): Promise<VisaApplication[]> {
    let query = supabase
      .from("visa_applications")
      .select("*")
      .eq("booking_id", bookingId);

    if (options?.role === "visa_officer") {
      query = query.or(`assigned_to.eq.${options.userId},assigned_to.is.null`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toVisaApplication);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateVisaApplicationInput,
  ): Promise<VisaApplication> {
    const { data, error } = await supabase
      .from("visa_applications")
      .insert(toVisaApplicationInsert(input))
      .select()
      .single();

    if (error) throw error;
    const visaApplication = toVisaApplication(data);

    // Notify whoever created the application - createdBy/tenantId are
    // both nullable at the DB level (tenantId out of scope for the
    // v1.0.0 domain migration, createdBy on delete set null), so this is
    // skipped rather than guessing a recipient/tenant.
    if (visaApplication.createdBy && visaApplication.tenantId) {
      await notificationService.create(supabase, {
        tenantId: visaApplication.tenantId,
        userId: visaApplication.createdBy,
        type: "visa_created",
        title: "Visa application created",
        message: visaApplication.country
          ? `A new visa application was created for ${visaApplication.country}.`
          : "A new visa application was created.",
        metadata: { visaApplicationId: visaApplication.id, country: visaApplication.country },
      });
    }

    return visaApplication;
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateVisaApplicationInput,
  ): Promise<VisaApplication> {
    // Read the pre-update status so a visa_status_changed notification
    // can be raised - the update() call below only ever returns the new
    // row, same reasoning as bookingsService.update().
    const { data: existingRow, error: existingError } = await supabase
      .from("visa_applications")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    const { data, error } = await supabase
      .from("visa_applications")
      .update(toVisaApplicationUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const visaApplication = toVisaApplication(data);

    if (
      existingRow &&
      existingRow.status !== visaApplication.status &&
      visaApplication.createdBy &&
      visaApplication.tenantId
    ) {
      await notificationService.create(supabase, {
        tenantId: visaApplication.tenantId,
        userId: visaApplication.createdBy,
        type: "visa_status_changed",
        title: "Visa application status changed",
        message: `Visa application status changed from ${existingRow.status ?? "unset"} to ${visaApplication.status ?? "unset"}.`,
        metadata: {
          visaApplicationId: visaApplication.id,
          previousStatus: existingRow.status,
          newStatus: visaApplication.status,
        },
      });
    }

    return visaApplication;
  },

  // Hard delete - visa_applications has no deleted_at column.
  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("visa_applications").delete().eq("id", id);

    if (error) throw error;
  },
};
