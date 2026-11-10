const ARABIC_ZERO = 0x0660;

// A six-digit authenticator code ready to send, or null. Accepts Arabic
// digits and the space some apps show in the middle.
export function normalizeMfaCode(value: string): string | null {
  const code = value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_ZERO)).replace(/\s/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
