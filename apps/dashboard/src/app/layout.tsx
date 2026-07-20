import type { Metadata } from "next";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Travio Dashboard",
  description: "Manage bookings, customers, visas and finance for your agency.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
