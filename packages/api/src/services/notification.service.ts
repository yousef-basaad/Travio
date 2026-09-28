import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toNotification,
  toNotificationInsert,
  type Notification,
  type CreateNotificationInput,
} from "./notification.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes/other services. create() is called from inside
// other domain services (bookingsService, visaApplicationsService,
// documentService) as a direct side effect of their own mutations - not
// from an API route and not from an event bus, per the approved
// architecture (this codebase has no event-emitter precedent anywhere;
// bookingsService already calls bookingTimelineService.create() the
// same way).
export const notificationService = {
  // Capped at 50 - a notification bell/dropdown has no pagination UI,
  // and this is a personal (RLS: user_id = auth.uid()) feed, not a
  // tenant-wide list, so unbounded growth per user is the relevant
  // limit to guard against, not per-tenant volume.
  async listByUser(supabase: SupabaseClient<Database>, userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data.map(toNotification);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toNotification(data) : null;
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateNotificationInput,
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert(toNotificationInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toNotification(data);
  },

  async markRead(supabase: SupabaseClient<Database>, id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toNotification(data);
  },

  // Bulk update, RLS (user_id = auth.uid()) already scopes this to the
  // caller's own notifications - the userId param is only for the
  // .eq() filter, never trusted as an authorization boundary on its own.
  async markAllRead(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw error;
  },
};
