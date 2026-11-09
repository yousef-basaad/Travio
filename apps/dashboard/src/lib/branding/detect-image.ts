export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export interface DetectedImage {
  contentType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpg" | "webp";
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

// The file's real type from its first bytes. The browser's claimed type
// and the file name can say anything, and an SVG or HTML file must never
// reach a public bucket.
export function detectImage(bytes: Uint8Array): DetectedImage | null {
  if (startsWith(bytes, PNG)) return { contentType: "image/png", extension: "png" };
  if (startsWith(bytes, JPEG)) return { contentType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, 8)) return { contentType: "image/webp", extension: "webp" };
  return null;
}
