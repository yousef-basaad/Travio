import type { Metadata } from "next";
import "@travio/ui/styles.css";

export const metadata: Metadata = {
  title: "Travio - Travel Agency Platform",
  description: "The all-in-one platform for Saudi travel agencies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
