"use client";

import { useState, type FormEvent } from "react";
import { Button, FormField, Input, Textarea } from "@travio/ui";
import { submitInquiry } from "../api/submit-inquiry";
import { HONEYPOT_FIELD } from "../schemas/inquiry.schema";
import { useT } from "@/lib/i18n/i18n-provider";

// The server action (submit-inquiry.ts) reads agencyName/email/message
// from FormData. This form shows 4 fields (Name/Email/Company/Message) by
// folding the contact's name into the message body rather than dropping
// it - nothing entered here is silently lost. A hidden honeypot field
// (HONEYPOT_FIELD) is sent too: people never see it, bots often fill it.
export function InquiryForm() {
  const t = useT();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate_limited">("idle");

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

    formData.set(HONEYPOT_FIELD, (form.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement).value);

    try {
      const result = await submitInquiry(formData);
      if (result.status === "rate_limited") {
        setStatus("rate_limited");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <p className="text-sm font-medium text-foreground">{t("contact.successTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("contact.successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label={t("contact.name")} htmlFor="contact-name">
        <Input id="contact-name" name="name" required autoComplete="name" maxLength={80} />
      </FormField>

      <FormField label={t("contact.email")} htmlFor="contact-email">
        <Input id="contact-email" name="email" type="email" required autoComplete="email" maxLength={254} />
      </FormField>

      <FormField label={t("contact.company")} htmlFor="contact-company">
        <Input id="contact-company" name="company" required autoComplete="organization" maxLength={200} />
      </FormField>

      <FormField label={t("contact.message")} htmlFor="contact-message">
        <Textarea id="contact-message" name="message" rows={5} required minLength={10} maxLength={4900} />
      </FormField>

      {/* Honeypot: hidden from people and assistive tech, left empty by
          them; bots that fill every field get a fake success. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`contact-${HONEYPOT_FIELD}`}>{t("contact.honeypot")}</label>
        <input id={`contact-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" ? (
        <p role="alert" className="text-sm text-danger">
          {t("contact.error")}
        </p>
      ) : null}

      {status === "rate_limited" ? (
        <p role="alert" className="text-sm text-danger">
          {t("contact.rateLimited")}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {t(status === "submitting" ? "contact.sending" : "contact.submit")}
      </Button>
    </form>
  );
}
