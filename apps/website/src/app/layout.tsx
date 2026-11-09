import type { Metadata } from "next";
import { Geist, Tajawal } from "next/font/google";
import "@travio/ui/styles.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { getLocale, getT } from "@/lib/i18n/get-locale";
import { dirOf } from "@/lib/i18n/locales";

// Same font wiring as the dashboard's Design System v2.0 (Geist,
// exposed as --font-sans, consumed by globals.css's `font-sans` body
// rule) - previously nothing set a font-family on <body> here either,
// so this site rendered in the browser's default serif font.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Arabic glyphs (Geist has none) and headings, as in the dashboard: the
// preset's font stacks fall back to --font-heading.
const tajawalHeading = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.siteTitle"),
    description: t("meta.siteDescription"),
    openGraph: {
      siteName: t("brand.name"),
      title: t("meta.siteTitle"),
      description: t("meta.siteDescription"),
      type: "website",
    },
  };
}

// lang/dir follow the visitor's language (cookie, or the browser's
// preference on a first visit), read on the server so the first render
// already has the right direction.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${geistSans.variable} ${tajawalHeading.variable}`}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider locale={locale}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
