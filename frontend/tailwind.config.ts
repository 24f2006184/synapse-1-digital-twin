import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030712",
        surface: "#0f172a",
        "surface-2": "#1e293b",
        "surface-3": "#334155",
        accent: "#06b6d4",
        "accent-dim": "#0e7490",
        warning: "#f59e0b",
        danger: "#ef4444",
        success: "#10b981",
        muted: "#94a3b8",
        border: "#1e293b",
        soma: "#a78bfa",
        axon: "#34d399",
        dendrite: "#60a5fa",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "neural-pulse": "neuralPulse 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        neuralPulse: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "neural-grid":
          "radial-gradient(circle at 1px 1px, rgba(6,182,212,0.15) 1px, transparent 0)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(6,182,212,0.4)",
        "glow-warning": "0 0 20px rgba(245,158,11,0.4)",
        "glow-danger": "0 0 20px rgba(239,68,68,0.4)",
        "glow-success": "0 0 15px rgba(16,185,129,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
