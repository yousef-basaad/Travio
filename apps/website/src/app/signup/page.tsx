import type { Metadata } from "next";
import { SignupForm } from "@/features/signup/components/signup-form";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Create your agency - Travio",
  description: "Sign up your travel agency for Travio.",
};

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-lg px-6 pb-24 pt-20 sm:pt-28">
      <SectionHeader
        eyebrow="Get started"
        title="Create your agency"
        description="Set up your Travio workspace in a minute."
      />
      <div className="mt-10">
        <SignupForm />
      </div>
    </section>
  );
}
