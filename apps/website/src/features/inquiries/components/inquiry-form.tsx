"use client";

import { useState, type FormEvent } from "react";
import { Button, FormField, Input, Textarea } from "@travio/ui";
import { submitInquiry } from "../api/submit-inquiry";

// The underlying server action/schema (submit-inquiry.ts) only ever
// reads 3 named fields (agencyName/email/message) from FormData - it is
// intentionally untouched (out of this phase's scope: "do not modify
// APIs"). This form still shows the requested 4 fields (Name/Email/
// Company/Message) by folding the contact's name into the message body
// before submission rather than dropping it - nothing entered here is
// silently lost.
export function InquiryForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const company = (form.elements.namedItem("company") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    const formData = new FormData();
    formData.set("agencyName", company);
    formData.set("email", email);
    formData.set("message", `From: ${name}\n\n${message}`);

    try {
      await submitInquiry(formData);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Thanks - we&rsquo;ve got your message.</p>
        <p className="mt-1 text-sm text-muted-foreground">Our team will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label="Name" htmlFor="contact-name">
        <Input id="contact-name" name="name" required autoComplete="name" />
      </FormField>

      <FormField label="Email" htmlFor="contact-email">
        <Input id="contact-email" name="email" type="email" required autoComplete="email" />
      </FormField>

      <FormField label="Company" htmlFor="contact-company">
        <Input id="contact-company" name="company" required autoComplete="organization" />
      </FormField>

      <FormField label="Message" htmlFor="contact-message">
        <Textarea id="contact-message" name="message" rows={5} required minLength={10} />
      </FormField>

      {status === "error" ? (
        <p role="alert" className="text-sm text-danger">
          Something went wrong sending your message. Please try again.
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Request a Demo"}
      </Button>
    </form>
  );
}
