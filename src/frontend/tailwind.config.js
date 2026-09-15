/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F172A",
          muted: "#64748B"
        },
        accent: {
          DEFAULT: "#10B981", // Emerald
          hover: "#059669",
          light: "#ECFDF5"
        },
        negative: {
          DEFAULT: "#EF4444", // Red
          light: "#FEF2F2"
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber
          light: "#FFFBEB"
        },
        border: "#E2E8F0"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Libre Caslon Text", "Georgia", "serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"]
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "10px",
        "3xl": "12px"
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
      }
    },
  },
  plugins: [],
}
