"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tenant } from "@travio/api";

export const TENANT_QUERY_KEY = ["tenant"];

async function fetchTenant(): Promise<Tenant> {
  const response = await fetch("/api/tenant");

  if (!response.ok) {
    throw new Error(`Failed to load agency profile (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/tenant");
  }

  return data as Tenant;
}

export function useTenant() {
  return useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: fetchTenant,
  });
}

async function updateTenant(input: {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): Promise<Tenant> {
  const response = await fetch("/api/tenant", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to save agency profile (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/tenant");
  }

  return data as Tenant;
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTenant,
    onSuccess: (tenant) => {
      queryClient.setQueryData(TENANT_QUERY_KEY, tenant);
    },
  });
}
