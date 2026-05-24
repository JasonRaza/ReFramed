import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0a0a0a",
        primary: "#7c3aed",
        highlight: "#a78bfa",
        surface: "#161616",
        "surface-hover": "#1e1e1e",
        "surface-border": "#2a2a2a",
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
