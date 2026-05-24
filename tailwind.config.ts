import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "var(--bg-base)",
        primary: "#7c3aed",
        highlight: "#a78bfa",
        surface: "var(--bg-surface)",
        "surface-hover": "var(--bg-hover)",
        "surface-border": "var(--bg-border)",
        amber: { DEFAULT: "#f6b73c" },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,58,237,0.4)",
        "glow-sm": "none",
        glass: "none",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
