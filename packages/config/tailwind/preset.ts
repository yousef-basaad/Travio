// Shared Tailwind preset consumed by every app + the ui package.
// Keeps design tokens (colors, radii, fonts) consistent platform-wide.
// RTL-aware defaults included since Travio primarily serves Saudi Arabia (Arabic UI).
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export const travioPreset: Partial<Config> = {
  darkMode: ["class"],
  theme: {
    extend: {
      // Design System v2.5 (Product-8.2 Phase 1): two distinct families
      // now, matching the reference's "Tajawal (Arabic headings) + Inter
      // (English/body)" spec - previously only `sans` existed (Geist).
      // `sans` is body text (apps/dashboard now loads Inter into
      // --font-sans, see its root layout); `heading` is for
      // heading-sized text specifically (globals.css applies it to
      // h1-h6 and the text-heading-* and text-display utility classes
      // directly, so no component file needs to add a font-heading
      // class itself). Both wrap their var() in a fallback argument
      // (`var(--x, var(--font-sans))`) rather than relying on
      // cascade-order tricks - an app that never loads Tajawal (every
      // app except dashboard, for now) safely falls back to its own
      // --font-sans instead of an invalid/empty font-family.
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Tahoma", "system-ui", "sans-serif"],
        heading: [
          "var(--font-heading, var(--font-sans))",
          "Inter",
          "Tahoma",
          "system-ui",
          "sans-serif",
        ],
      },
      // Design System v2.5 (Product-8.2 Phase 1): typography scale
      // retuned to the TRAVIO reference's exact H1-H5/Body-Large/Body/
      // Small/X-Small numbers (tokens.css has the full mapping/
      // rationale) - heading-xs and body-lg are net-new tiers the
      // reference has that this scale didn't cover before. Still
      // additive: Tailwind's own text-2xl/text-lg/text-sm/text-xs scale
      // is untouched.
      fontSize: {
        display: [
          "var(--font-size-display)",
          { lineHeight: "var(--line-height-display)", fontWeight: "var(--font-weight-display)" },
        ],
        "heading-xl": [
          "var(--font-size-heading-xl)",
          {
            lineHeight: "var(--line-height-heading-xl)",
            fontWeight: "var(--font-weight-heading-xl)",
          },
        ],
        "heading-lg": [
          "var(--font-size-heading-lg)",
          {
            lineHeight: "var(--line-height-heading-lg)",
            fontWeight: "var(--font-weight-heading-lg)",
          },
        ],
        "heading-md": [
          "var(--font-size-heading-md)",
          {
            lineHeight: "var(--line-height-heading-md)",
            fontWeight: "var(--font-weight-heading-md)",
          },
        ],
        "heading-sm": [
          "var(--font-size-heading-sm)",
          {
            lineHeight: "var(--line-height-heading-sm)",
            fontWeight: "var(--font-weight-heading-sm)",
          },
        ],
        "heading-xs": [
          "var(--font-size-heading-xs)",
          {
            lineHeight: "var(--line-height-heading-xs)",
            fontWeight: "var(--font-weight-heading-xs)",
          },
        ],
        "body-lg": [
          "var(--font-size-body-lg)",
          { lineHeight: "var(--line-height-body-lg)", fontWeight: "var(--font-weight-body-lg)" },
        ],
        body: [
          "var(--font-size-body)",
          { lineHeight: "var(--line-height-body)", fontWeight: "var(--font-weight-body)" },
        ],
        small: [
          "var(--font-size-small)",
          { lineHeight: "var(--line-height-small)", fontWeight: "var(--font-weight-small)" },
        ],
        caption: [
          "var(--font-size-caption)",
          { lineHeight: "var(--line-height-caption)", fontWeight: "var(--font-weight-caption)" },
        ],
      },
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          muted: "hsl(var(--border-muted))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Design system semantic colors - additive only, destructive
        // (above) is untouched and still the primary "negative" color in
        // use throughout the app today. danger is the same hue as
        // destructive under the design system's formal vocabulary;
        // success/warning/info are the v1.5 additions (see tokens.css).
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design System v2.0 additions below - net-new semantic surfaces,
        // nothing here changes an existing utility's meaning.
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
          muted: "hsl(var(--surface-muted))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
          hover: "hsl(var(--sidebar-hover))",
        },
        // Design System v2.5 (Product-8.2 Phase 1): a second, genuinely
        // new brand accent (sky-blue family) - see tokens.css's own
        // comment for why this isn't a repurposing of `secondary`.
        // Available now (bg-brand-secondary/text-brand-secondary/etc.)
        // for whichever Phase 2/3 screen first needs a second
        // categorical accent (e.g. a chart series, an icon-chip tone).
        brand: {
          secondary: {
            DEFAULT: "hsl(var(--brand-secondary))",
            foreground: "hsl(var(--brand-secondary-foreground))",
          },
        },
      },
      // Unified radius scale (buttons/inputs/badges use sm-md, cards/
      // dialogs/tables use lg, larger surfaces reserve xl) - replaces the
      // old single --radius + calc() derivation with named tiers
      // (tokens.css). A deliberate, foundation-level visual tightening:
      // every existing rounded-sm/md/lg utility picks up the new value
      // automatically, no component call site changes.
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      // Elevation system (tokens.css), v2.1: retuned to match the
      // reference design system's own shadow scale.
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      transitionDuration: {
        DEFAULT: "var(--duration-base)",
        fast: "var(--duration-fast)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease-default)",
      },
      // Design System v2.4 (Product-8.1): shimmer for Skeleton (a moving
      // highlight sweep reads as "actively loading" more than a flat
      // opacity pulse) and a slide-in for the mobile nav drawer - both
      // additive, no existing animate-* usage anywhere changes.
      // tailwindcss-animate (registered below) supplies the enter/exit
      // primitives (fade-in/zoom-in/slide-in-from-*) that
      // DropdownMenu/Popover/Toast build on.
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
      },
      backgroundImage: {
        // Used sparingly (welcome banner, KPI icon chips) per the
        // "subtle gradients" brief - indigo primary into a neighboring
        // violet, never a loud/rainbow gradient.
        "brand-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 83% 68%) 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default travioPreset;
