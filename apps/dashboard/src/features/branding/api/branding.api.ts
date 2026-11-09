"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SaveBrandingInput, TenantBranding } from "@travio/api";

export const BRANDING_QUERY_KEY = ["branding"];

export class BrandingRequestError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function read(response: Response): Promise<TenantBranding> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new BrandingRequestError(body?.error ?? "failed");
  }
  return (await response.json()) as TenantBranding;
}

export function useBranding() {
  return useQuery({ queryKey: BRANDING_QUERY_KEY, queryFn: async () => read(await fetch("/api/branding")) });
}

function useBrandingMutation<Input>(send: (input: Input) => Promise<Response>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Input) => read(await send(input)),
    onSuccess: (branding) => queryClient.setQueryData(BRANDING_QUERY_KEY, branding),
  });
}

export function useSaveBranding() {
  return useBrandingMutation((input: SaveBrandingInput) =>
    fetch("/api/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export function useUploadLogo() {
  return useBrandingMutation((file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch("/api/branding/logo", { method: "POST", body: form });
  });
}

export function useRemoveLogo() {
  return useBrandingMutation((_: void) => fetch("/api/branding/logo", { method: "DELETE" }));
}
