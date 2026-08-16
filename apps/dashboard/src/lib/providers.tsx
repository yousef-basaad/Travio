"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@travio/ui";

// Single place composing all client-side providers (TanStack Query today;
// SessionProvider from @travio/auth is added per-layout where session
// data is available from the server, not globally, to avoid a data fetch
// waterfall on every route).
//
// Design System v2.4 (Product-8.1): <Toaster/> mounted once here - the
// shared imperative toast() function (packages/ui) works from anywhere
// (e.g. a mutation's onSuccess/onError) as soon as this is in the tree,
// no per-feature setup needed.
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
