// Turns an agency's chosen colors into the CSS variables the design
// tokens read (packages/ui/src/styles/tokens.css). These values end up in
// a <style> tag, so input is accepted only as strict #RRGGBB and output
// is built purely from numbers.

const HEX = /^#[0-9a-fA-F]{6}$/;
const WHITE = "0 0% 100%";
const DARK = "222 47% 11%";

/** The Travio defaults, shown when an agency hasn't chosen its own. */
export const DEFAULT_PRIMARY = "#6366f1";
export const DEFAULT_SIDEBAR = "#0f172a";

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255) as [number, number, number];
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function toHsl(hex: string): Hsl {
  const [r, g, b] = channels(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

  const s = delta / (1 - Math.abs(2 * l - 1));
  const sector = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  const h = (sector * 60 + 360) % 360;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function css({ h, s, l }: Hsl): string {
  return `${h} ${s}% ${Math.min(100, Math.max(0, l))}%`;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// WCAG contrast decides between white and dark text, so any color an
// agency picks stays readable.
const DARK_LUMINANCE = luminance("#0f172a");
export function readableOn(hex: string): "white" | "dark" {
  const background = luminance(hex);
  return contrast(background, 1) >= contrast(background, DARK_LUMINANCE) ? "white" : "dark";
}

export function brandThemeVars(colors: { primaryColor: string | null; sidebarColor: string | null }): Record<string, string> {
  const vars: Record<string, string> = {};

  if (isHexColor(colors.primaryColor)) {
    const primary = toHsl(colors.primaryColor);
    const foreground = readableOn(colors.primaryColor) === "white" ? WHITE : DARK;
    vars["--primary"] = css(primary);
    vars["--primary-hover"] = css({ ...primary, l: primary.l - 5 });
    vars["--primary-foreground"] = foreground;
    vars["--ring"] = css(primary);
    vars["--sidebar-active"] = css(primary);
    vars["--sidebar-active-foreground"] = foreground;
  }

  if (isHexColor(colors.sidebarColor)) {
    const sidebar = toHsl(colors.sidebarColor);
    const lightText = readableOn(colors.sidebarColor) === "white";
    const step = lightText ? 1 : -1;
    vars["--sidebar-background"] = css(sidebar);
    vars["--sidebar-foreground"] = lightText ? "210 40% 98%" : DARK;
    vars["--sidebar-border"] = css({ ...sidebar, l: sidebar.l + step * 9 });
    vars["--sidebar-hover"] = css({ ...sidebar, l: sidebar.l + step * 7 });
  }

  return vars;
}

/** The variables as a stylesheet, or "" when the agency uses the defaults. */
export function brandThemeCss(colors: { primaryColor: string | null; sidebarColor: string | null }): string {
  const entries = Object.entries(brandThemeVars(colors));
  if (entries.length === 0) return "";
  return `:root{${entries.map(([name, value]) => `${name}:${value}`).join(";")}}`;
}
