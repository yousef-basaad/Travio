import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Travio's own marketing pages. Agency sites (/sites/[slug]) live outside
// this group so they carry the agency's brand, not Travio's navigation.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
