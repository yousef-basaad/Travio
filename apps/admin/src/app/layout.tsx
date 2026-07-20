import type { Metadata } from "next";
import "@travio/ui/styles.css";
import { AppProviders } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Travio - Platform Admin",
  description: "Manage tenants, billing, and platform-wide settings.",
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
