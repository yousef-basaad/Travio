import type { ReactNode } from "react";

// Text that is always left-to-right (phone numbers, emails, codes), kept
// in order inside Arabic/RTL layouts: without it "+966 50..." renders as
// "50... 966+". <bdi> also isolates it from the surrounding text.
export function LtrText({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}
