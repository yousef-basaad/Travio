import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirOf } from "@/lib/i18n/locales";

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

// Arabic + Latin subsets: also the fallback for Arabic text in body copy
// (Inter has no Arabic glyphs - see the preset's fontFamily.sans).
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

// lang/dir follow the language chosen in the user menu (a cookie, read on
// the server so the first render already has the right direction).
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${interSans.variable} ${tajawalHeading.variable}`}>
      <body>
        <I18nProvider locale={locale}>
          <AppProviders>{children}</AppProviders>
        </I18nProvider>
      </body>
    </html>
  );
}
