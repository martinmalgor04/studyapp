import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "surface-variant": "var(--color-surface-variant)",
        "surface-dim": "var(--color-surface-dim)",

        primary: "var(--color-primary)",
        "primary-dim": "var(--color-primary-dim)",
        "primary-container": "var(--color-primary-container)",
        "on-primary": "var(--color-on-primary)",
        "on-primary-container": "var(--color-on-primary-container)",

        secondary: "var(--color-secondary)",
        "secondary-dim": "var(--color-secondary-dim)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary": "var(--color-on-secondary)",
        "on-secondary-container": "var(--color-on-secondary-container)",

        tertiary: "var(--color-tertiary)",
        "tertiary-dim": "var(--color-tertiary-dim)",
        "tertiary-container": "var(--color-tertiary-container)",
        "on-tertiary": "var(--color-on-tertiary)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",

        warning: "var(--color-warning)",
        "warning-dim": "var(--color-warning-dim)",
        "warning-container": "var(--color-warning-container)",
        "on-warning": "var(--color-on-warning)",
        "on-warning-container": "var(--color-on-warning-container)",

        error: "var(--color-error)",
        "error-dim": "var(--color-error-dim)",
        "error-container": "var(--color-error-container)",
        "on-error": "var(--color-on-error)",
        "on-error-container": "var(--color-on-error-container)",

        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "on-background": "var(--color-on-background)",

        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",

        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-primary": "var(--color-inverse-primary)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
      },

      fontFamily: {
        headline: ["var(--font-newsreader)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        label: ["var(--font-inter)", "sans-serif"],
      },

      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
      },

      boxShadow: {
        subtle: "0 4px 20px -4px rgba(0,0,0,0.05)",
        card: "0 1px 3px rgba(0,0,0,0.04)",
      },

      keyframes: {
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 300ms ease-out",
        "slide-in-left": "slide-in-left 300ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
