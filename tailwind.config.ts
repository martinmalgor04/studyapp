import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        background: "#fbf9f6",
        surface: "#fbf9f6",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3f0",
        "surface-container": "#eeeeea",
        "surface-container-high": "#e8e8e3",
        "surface-container-highest": "#e2e3dd",
        "surface-variant": "#e2e3dd",
        "surface-dim": "#d9dbd4",

        // Primary (warm gray)
        primary: "#5f5e5e",
        "primary-dim": "#535252",
        "primary-container": "#e4e2e1",
        "on-primary": "#faf7f6",
        "on-primary-container": "#525151",

        // Secondary (sage green)
        secondary: "#546357",
        "secondary-dim": "#48574c",
        "secondary-container": "#d7e7d8",
        "on-secondary": "#edfdee",
        "on-secondary-container": "#47554a",

        // Tertiary (muted indigo)
        tertiary: "#4e5d91",
        "tertiary-dim": "#425184",
        "tertiary-container": "#b2c1fd",
        "on-tertiary": "#faf8ff",
        "on-tertiary-container": "#2c3c6e",

        // Warning (warm amber)
        warning: "#8b6914",
        "warning-dim": "#6e5310",
        "warning-container": "#f5dfa0",
        "on-warning": "#fffaf0",
        "on-warning-container": "#5c4510",

        // Error (warm red)
        error: "#9e422c",
        "error-dim": "#5c1202",
        "error-container": "#fe8b70",
        "on-error": "#fff7f6",
        "on-error-container": "#742410",

        // Text
        "on-surface": "#30332f",
        "on-surface-variant": "#5d605b",
        "on-background": "#30332f",

        // Borders
        outline: "#797b77",
        "outline-variant": "#b1b3ad",

        // Inverse
        "inverse-surface": "#0e0e0d",
        "inverse-primary": "#ffffff",
        "inverse-on-surface": "#9e9d9a",
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
    },
  },
  plugins: [],
};

export default config;
