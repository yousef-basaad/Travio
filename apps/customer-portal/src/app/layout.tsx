import type { Metadata } from "next";
import { Inter, Tajawal } from "next/font/google";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirOf } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

// Same fonts as the dashboard: Inter for Latin text, Tajawal for
// headings and as the Arabic fallback (Inter has no Arabic glyphs).
const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const tajawalHeading = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: translate(locale, "app.title"), description: translate(locale, "app.description") };
}

// lang/dir follow the language chosen in the header (a cookie, read on
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
