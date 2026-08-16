import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { Booking, BookingStatus, UserRole } from "@travio/types";
import { bookingTimelineService } from "./booking-timeline.service";
import { notificationService } from "./notification.service";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsertRow = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdateRow = Database["public"]["Tables"]["bookings"]["Update"];

export interface CreateBookingInput {
  tenantId: string;
  customerId: string;
  /**
   * Optional - bookings.booking_number is globally unique (not scoped
   * per-tenant), so when omitted, create() generates one itself rather
   * than requiring every caller to invent a collision-safe value.
   */
  bookingNumber?: string;
  title: string;
  branchId?: string | null;
  assignedTo?: string | null;
  status?: BookingStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalAmount?: number;
  currency?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateBookingInput {
  customerId?: string;
  bookingNumber?: string;
  title?: string;
  branchId?: string | null;
  assignedTo?: string | null;
  status?: BookingStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalAmount?: number;
  currency?: string | null;
  notes?: string | null;
}

export interface ListBookingsOptions {
  role: UserRole;
  userId: string;
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    branchId: row.branch_id,
    assignedTo: row.assigned_to,
    bookingNumber: row.booking_number,
    status: row.status,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmount: row.total_amount,
    currency: row.currency,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// bookings.booking_number carries a plain `unique` constraint (global,
// not per-tenant), so a per-tenant sequential counter would risk
// collisions across agencies. A date stamp + short random suffix is
// unique enough in practice (36^4 combinations per day, across every
// tenant) that a collision is not worth guarding against with a
// retry loop - no other write path in this codebase retries on a
// unique-constraint violation either, and the DB constraint remains
// the authoritative backstop if the near-impossible ever happens.
function generateBookingNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${datePart}-${randomPart}`;
}

function toBookingInsert(input: CreateBookingInput): BookingInsertRow {
  return {
    tenant_id: input.tenantId,
    customer_id: input.customerId,
    booking_number: input.bookingNumber ?? generateBookingNumber(),
    title: input.title,
    branch_id: input.branchId,
    assigned_to: input.assignedTo,
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate,
    total_amount: input.totalAmount,
    currency: input.currency,
    notes: input.notes,
    created_by: input.createdBy,
  };
}

function toBookingUpdate(input: UpdateBookingInput): BookingUpdateRow {
  return {
    customer_id: input.customerId,
    booking_number: input.bookingNumber,
    title: input.title,
    branch_id: input.branchId,
    assigned_to: input.assignedTo,
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate,
    total_amount: input.totalAmount,
    currency: input.currency,
    notes: input.notes,
  };
}

// Service layer: raw Supabase queries live here, never inline in components.
// Each app's feature hooks (e.g. features/bookings/api) call these, wired
// with either the browser or server client depending on context.
export const bookingsService = {
  // See customer.service.ts's list() comment - the sales_agent .or()
  // clause here mirrors what bookings_tenant_access (RLS, Phase 4C.1)
  // already enforces at the database level; this is defense-in-depth,
  // not the sole gate.
  async list(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options?: ListBookingsOptions,
  ): Promise<Booking[]> {
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (options?.role === "sales_agent") {
      query = query.or(`assigned_to.eq.${options.userId},assigned_to.is.null`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toBooking);
  },

  // Product-5: the one booking-adjacent domain that didn't already have
  // a listByCustomer (invoiceService/visaApplicationsService both do) -
  // added for the customer portal, which has no tenantId to call list()
  // with (customer profiles are deliberately tenant-less - see the
  // identity migration). bookings_customer_access RLS (same migration)
  // is the actual security boundary here, not this .eq() - a caller
  // passing someone else's customerId still only ever gets their own
  // rows back, same "app-level filter is defense-in-depth, RLS is the
  // real gate" convention this file's list() already documents.
  async listByCustomer(
    supabase: SupabaseClient<Database>,
    customerId: string,
  ): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toBooking);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? toBooking(data) : null;
  },

  async create(supabase: SupabaseClient<Database>, input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .insert(toBookingInsert(input))
      .select()
      .single();

    if (error) throw error;
    const booking = toBooking(data);

    await bookingTimelineService.create(supabase, {
      tenantId: booking.tenantId,
      bookingId: booking.id,
      type: "booking_created",
      createdBy: booking.createdBy,
    });

    // Notify whoever created the booking - the only actor this row
    // actually records (see ADR-0004: assignment/ownership scoping
    // beyond this is explicitly deferred, so this is not a stand-in for
    // a broader "assigned agent" notion). createdBy is nullable
    // (on delete set null), so this is skipped rather than guessing a
    // recipient.
    if (booking.createdBy) {
      await notificationService.create(supabase, {
        tenantId: booking.tenantId,
        userId: booking.createdBy,
        type: "booking_created",
        title: "Booking created",
        message: `Booking ${booking.bookingNumber} was created.`,
        metadata: { bookingId: booking.id },
      });
    }

    return booking;
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateBookingInput,
  ): Promise<Booking> {
    // Read the pre-update status so a status_changed event can be raised
    // alongside booking_updated - the update() call below only ever
    // returns the new row, so this is the only way to know what changed.
    const { data: existingRow, error: existingError } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    const { data, error } = await supabase
      .from("bookings")
      .update(toBookingUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const booking = toBooking(data);

    await bookingTimelineService.create(supabase, {
      tenantId: booking.tenantId,
      bookingId: booking.id,
      type: "booking_updated",
    });

    if (existingRow && existingRow.status !== booking.status) {
      await bookingTimelineService.create(supabase, {
        tenantId: booking.tenantId,
        bookingId: booking.id,
        type: "status_changed",
        description: `Status changed from ${existingRow.status} to ${booking.status}`,
        metadata: { from: existingRow.status, to: booking.status },
      });

      if (booking.createdBy) {
        await notificationService.create(supabase, {
          tenantId: booking.tenantId,
          userId: booking.createdBy,
          type: "booking_status_changed",
          title: "Booking status changed",
          message: `Booking ${booking.bookingNumber} status changed from ${existingRow.status} to ${booking.status}.`,
          metadata: { bookingId: booking.id, previousStatus: existingRow.status, newStatus: booking.status },
        });
      }
    }

    return booking;
  },

  // Soft delete only - no delete grant on bookings for authenticated.
  async softDelete(supabase: SupabaseClient<Database>, id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toBooking(data);
  },
};
