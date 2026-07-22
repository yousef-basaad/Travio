import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { Booking, BookingStatus } from "@travio/types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsertRow = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdateRow = Database["public"]["Tables"]["bookings"]["Update"];

export interface CreateBookingInput {
  tenantId: string;
  customerId: string;
  bookingNumber: string;
  title: string;
  branchId?: string | null;
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
  status?: BookingStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalAmount?: number;
  currency?: string | null;
  notes?: string | null;
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    branchId: row.branch_id,
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

function toBookingInsert(input: CreateBookingInput): BookingInsertRow {
  return {
    tenant_id: input.tenantId,
    customer_id: input.customerId,
    booking_number: input.bookingNumber,
    title: input.title,
    branch_id: input.branchId,
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
  async list(supabase: SupabaseClient<Database>, tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("tenant_id", tenantId)
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
    return toBooking(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateBookingInput,
  ): Promise<Booking> {
    const { data, error } = await supabase
      .from("bookings")
      .update(toBookingUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toBooking(data);
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
