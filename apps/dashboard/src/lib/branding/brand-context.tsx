"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface BrandLockup {
  logoUrl: string | null;
  agencyName: string | null;
}

const BrandContext = createContext<BrandLockup>({ logoUrl: null, agencyName: null });

// The agency's logo and name for the sidebar, read on the server by
// (dashboard)/layout.tsx.
export function BrandProvider({ value, children }: { value: BrandLockup; children: ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrandLockup(): BrandLockup {
  return useContext(BrandContext);
}
