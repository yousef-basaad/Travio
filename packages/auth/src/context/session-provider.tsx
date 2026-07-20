"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@travio/types";

// Hydrated once from a Server Component (see each app's root layout) and
// made available client-side without an extra fetch/flash of unauth state.
type SessionContextValue = { profile: Profile | null };

const SessionContext = createContext<SessionContextValue>({ profile: null });

export function SessionProvider({
  profile,
  children,
}: {
  profile: Profile | null;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={{ profile }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
