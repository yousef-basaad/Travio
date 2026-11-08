import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirOf } from "@/lib/i18n/locales";

// Same fonts as the dashboard: Inter for Latin text and numbers, Tajawal
// for headings and Arabic.
const interSans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const tajawalHeading = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Travio - Platform Admin",
  description: "Manage agencies, subscriptions and platform-wide settings.",
};

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
