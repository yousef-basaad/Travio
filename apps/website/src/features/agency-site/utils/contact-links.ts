// tel: and wa.me links from a number the database has already limited to
// phone characters. Only digits (and a leading + for tel:) go in the link.
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}
