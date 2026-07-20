import { Button } from "@travio/ui";
import { submitInquiry } from "../api/submit-inquiry";

export function InquiryForm() {
  return (
    <form action={submitInquiry} className="space-y-4">
      <input name="agencyName" placeholder="Agency name" required className="w-full rounded-md border px-3 py-2 text-sm" />
      <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border px-3 py-2 text-sm" />
      <textarea name="message" placeholder="Tell us about your agency" required className="w-full rounded-md border px-3 py-2 text-sm" />
      <Button type="submit" className="w-full">Request a demo</Button>
    </form>
  );
}
