import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import {
  toVisaApplication,
  toVisaApplicationInsert,
  toVisaApplicationUpdate,
  type VisaApplication,
  type CreateVisaApplicationInput,
  type UpdateVisaApplicationInput,
} from "./visa-applications.mapper";
import { notificationService } from "./notification.service";

export interface ListVisaApplicationsOptions {
  role: UserRole;
  userId: string;
}

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingFlightsService/bookingHotelsService/
// bookingTransfersService's shape - callers only ever see the mapped
// VisaApplication domain shape, never the generated Row type.
export const visaApplicationsService = {
  // The sales_agent .or() convention (Phase 4C.1's customer/crm-leads/
  // bookings services) is mirrored here for visa_officer - it's
  // defense-in-depth, not the sole gate: visa_applications_tenant_access
  // (RLS, Phase 4C.2) already restricts a visa_officer's session to
  // assigned-to-them-or-unassigned rows.
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
        metadata: { visaApplicationId: visaApplication.id },
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
