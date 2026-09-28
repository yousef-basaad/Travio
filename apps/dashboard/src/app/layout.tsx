import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";

// Design System v2.5 (Product-8.2 Phase 1): Inter (body/English) +
// Tajawal (headings, Arabic-capable) replace Geist, matching the TRAVIO
// reference's explicit font spec. Inter is variable (no discrete
// `weight` list, same pattern Geist used); Tajawal is a static family
// with only 400/500/700/800 available (no 600) - a token asking for
// weight 600 (heading-lg/heading-md) will render as the nearest
// available weight per the CSS font-matching spec (700, i.e. Bold) once
// Tajawal is the active family for that element - a known, acceptable
// approximation, not a bug.
const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Arabic + Latin subsets: this app doesn't render Arabic copy yet
// (Product-8.2's RTL work is foundation-only this phase - see
// packages/ui/src/styles/globals.css's own "RTL foundation" comment),
// but the font is loaded ready for it rather than added later as a
// second round-trip.
const tajawalHeading = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travio Dashboard",
  description: "Manage bookings, customers, visas and finance for your agency.",
};

// Design System v2.5 (Product-8.2 Phase 1): named constants instead of
// hardcoded literals on <html> - still "ltr"/"en" today (no content has
// been translated this phase), but flipping the whole app to Arabic/RTL
// later is now a one-line change here instead of a hunt-and-replace.
const DIR = "ltr";
const LANG = "en";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={LANG} dir={DIR} className={`${interSans.variable} ${tajawalHeading.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
