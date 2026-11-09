"use client";

import { useFormat } from "@/lib/i18n/i18n-provider";

// "2 minutes ago". The server and the browser each work it out against
// their own clock, so the text can legitimately differ by a moment;
// suppressHydrationWarning is for exactly this kind of timestamp.
export function RelativeTime({ iso }: { iso: string }) {
  const format = useFormat();
  return <span suppressHydrationWarning>{format.relativeTime(iso)}</span>;
}
