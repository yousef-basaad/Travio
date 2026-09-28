"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@travio/api";

// Stable top-level key - a single, always-"my own notifications" list,
// unlike INVOICES_QUERY_KEY's customer/booking/all variants, since this
// endpoint has no scoping params at all (RLS always returns only the
// caller's own rows).
export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

async function fetchNotifications(): Promise<Notification[]> {
  const response = await fetch("/api/notifications");

  if (!response.ok) {
    throw new Error(`Failed to load notifications (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/notifications");
  }

  return data as Notification[];
}

// One query backs both the bell's unread count and the dropdown's list -
// both read from the same cached data, no second endpoint/hook needed.
export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
  });
}

async function markNotificationRead(id: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${id}`, { method: "PATCH" });

  if (!response.ok) {
    throw new Error(`Failed to mark notification read (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/notifications/:id");
  }

  return data as Notification;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

async function markAllNotificationsRead(): Promise<void> {
  const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications read (${response.status})`);
  }
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
