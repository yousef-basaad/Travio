import type { Metadata } from "next";
import { SignupForm } from "@/features/signup/components/signup-form";
import { SectionHeader } from "@/components/section-header";
import { getT } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("meta.signupTitle"),
    description: t("meta.signupDescription"),
  };
}

export default async function SignupPage() {
  const t = await getT();
  return (
    <section className="mx-auto max-w-lg px-6 pb-24 pt-20 sm:pt-28">
      <SectionHeader
        eyebrow={t("signup.eyebrow")}
        title={t("signup.title")}
        description={t("signup.description")}
      />
      <div className="mt-10">
        <SignupForm />
      </div>
    </section>
  );
}
