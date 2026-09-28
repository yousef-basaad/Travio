"use client";

import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@travio/api";

export const PROFILE_QUERY_KEY = ["profile"];

async function fetchProfile(): Promise<Customer> {
  const response = await fetch("/api/profile");

  if (!response.ok) {
    throw new Error(`Failed to load profile (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/profile");
  }

  return data as Customer;
}

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
  });
}
