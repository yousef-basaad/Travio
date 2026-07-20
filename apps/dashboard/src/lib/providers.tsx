"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Single place composing all client-side providers (TanStack Query today;
// SessionProvider from @travio/auth is added per-layout where session
// data is available from the server, not globally, to avoid a data fetch
// waterfall on every route).
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
