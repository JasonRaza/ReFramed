import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0f0f14",
        primary: "#818cf8",
        highlight: "#c084fc",
        surface: "rgba(255, 255, 255, 0.03)",
        "surface-hover": "rgba(255, 255, 255, 0.06)",
        "surface-border": "rgba(255, 255, 255, 0.08)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(129, 140, 248, 0.25)",
        "glow-sm": "0 0 20px rgba(129, 140, 248, 0.15)",
        glass: "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
