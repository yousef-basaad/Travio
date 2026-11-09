import type { Metadata } from "next";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { SectionHeader } from "@/components/section-header";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.contactTitle"),
    description: t("meta.contactDescription"),
    openGraph: {
      title: t("meta.contactTitle"),
      description: t("meta.contactDescription"),
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const t = await getT();
  return (
    <section className="mx-auto max-w-lg px-6 pb-24 pt-20 sm:pt-28">
      <SectionHeader
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        description={t("contact.description")}
      />
      <div className="mt-10">
        <InquiryForm />
      </div>
    </section>
  );
}
