import type { Metadata } from "next";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Contact - Travio",
  description: "Get in touch with the Travio team to request a demo or ask a question.",
  openGraph: {
    title: "Contact - Travio",
    description: "Get in touch with the Travio team to request a demo or ask a question.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-lg px-6 pb-24 pt-20 sm:pt-28">
      <SectionHeader
        eyebrow="Contact"
        title="Talk to our team"
        description="Tell us about your agency and we'll get back to you shortly."
      />
      <div className="mt-10">
        <InquiryForm />
      </div>
    </section>
  );
}
