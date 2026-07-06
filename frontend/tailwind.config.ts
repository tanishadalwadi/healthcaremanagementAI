import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Pulse design tokens ───────────────────────────────────────────────
      colors: {
        // Surfaces
        bg: "#F6F1F1",
        surface: "#FFFFFF",
        "surface-alt": "#EFEBEF",

        // Brand (nav, avatars, primary buttons — never status/urgency)
        primary: "#7C5FAE",
        "primary-tint": "#EFE7F7",
        "hover-tint": "#C9BBDF",

        // Text
        "text-primary": "#1D1B2E",
        "text-secondary": "#6B6474",
        "text-muted": "#8A8394",

        // Status — on-track / delayed are dot-only, quiet
        "status-ontrack": "#4FB5A8",
        "status-delayed": "#E08A4F",
        // Status — blocked / critical are badge + left-border, never bare dot
        "status-blocked": "#4A4458",
        "status-critical": "#DC2626",

        // Status tints (badge backgrounds)
        "tint-ontrack": "#E1F3F0",
        "tint-delayed": "#FBE9DA",
        "tint-blocked": "#EFEBEF",
        "tint-critical": "#F8DFDB",

        // Status text inside badges
        "badge-text-ontrack": "#327A70",
        "badge-text-delayed": "#9A6435",
        "badge-text-blocked": "#4A4458",
        "badge-text-critical": "#A83F2F",

        // Danger (destructive actions)
        danger: "#DC2626",
        "danger-hover": "#C41F1F",

        // Button disabled
        "disabled-bg": "#EFEBEF",
        "disabled-text": "#B7B0BD",
        "disabled-border": "#E5E0E7",

        // shadcn/ui CSS-variable tokens — required so any shadcn component
        // that uses border-border / ring / etc. doesn't blow up at build time.
        // Values mirror the --border / --ring / --input vars in globals.css.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },

      // ─── Radius scale ──────────────────────────────────────────────────────
      borderRadius: {
        input: "4px",
        button: "10px",
        avatar: "12px", // 11–14px rounded-square, never circular
        card: "14px",
        panel: "18px",
        // lg/xl kept for shadcn compatibility
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ─── Font families ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Hanken Grotesk", "system-ui", "sans-serif"],
        mono: ["Spline Sans Mono", "ui-monospace", "monospace"],
      },

      // ─── Typography scale (used as fontSize tuples [size, lineHeight]) ────
      fontSize: {
        // Display — page-level headers (patient name on detail page)
        display: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        // Heading — card titles, section headers
        heading: ["14px", { lineHeight: "1.4", fontWeight: "600" }],
        "heading-lg": ["15px", { lineHeight: "1.4", fontWeight: "600" }],
        // Body — primary list/card content
        body: ["13px", { lineHeight: "1.5", fontWeight: "500" }],
        "body-sm": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        // Body small — secondary metadata
        meta: ["11px", { lineHeight: "1.4", fontWeight: "400" }],
        // caption intentionally omitted — .text-caption is defined as a full
        // @layer utilities rule in globals.css (with uppercase + letter-spacing).
        // Defining it here generates a conflicting Tailwind class that twMerge
        // strips when combined with text-{color} classes in cn().
        // Micro — dense sub-labels, used sparingly
        micro: ["9px", { lineHeight: "1.3", fontWeight: "400" }],
      },

      // ─── Spacing (Tailwind's default 4/8/12/16/24/32 covers this) ──────────

      // ─── Keyframes for skeleton shimmer ───────────────────────────────────
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
