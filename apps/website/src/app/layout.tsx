import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@travio/ui/styles.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Same font wiring as the dashboard's Design System v2.0 (Geist,
// exposed as --font-sans, consumed by globals.css's `font-sans` body
// rule) - previously nothing set a font-family on <body> here either,
// so this site rendered in the browser's default serif font.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Travio is the all-in-one operating system for travel agencies - CRM, bookings, visas, documents, finance, and analytics in one platform.";

export const metadata: Metadata = {
  title: "Travio - Run Your Travel Agency From One Platform",
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "Travio",
    title: "Travio - Run Your Travel Agency From One Platform",
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={geistSans.variable}>
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
