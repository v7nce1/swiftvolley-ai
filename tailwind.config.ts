import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        vt: {
          bg:             "#060E1C",
          surface:        "#0C1A2E",
          elevated:       "#122240",
          outline:        "#1C3355",
          blue:           "#38BDF8",
          "blue-bright":  "#7DD3FC",
          "blue-dim":     "#0E4C70",
          orange:         "#F97316",
          "orange-light": "#FB923C",
          "orange-dim":   "#7C2D12",
          text:           "#EFF6FF",
          muted:          "rgba(239,246,255,0.5)",
          faint:          "rgba(239,246,255,0.2)",
          green:          "#34D399",
          red:            "#F87171",
          amber:          "#FBBF24",
        },
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        sans:    ["'DM Sans'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
      },
      animation: {
        "fade-in":    "fadeIn 0.35s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-ring": "pulseRing 1.4s ease-out infinite",
        "spin-slow":  "spin 2.5s linear infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseRing: {
          "0%":   { transform: "scale(1)",   opacity: "0.8" },
          "100%": { transform: "scale(1.8)", opacity: "0"   },
        },
      },
      boxShadow: {
        "blue-glow":   "0 0 24px rgba(56,189,248,0.25), 0 0 8px rgba(56,189,248,0.1)",
        "orange-glow": "0 0 24px rgba(249,115,22,0.3),  0 0 8px rgba(249,115,22,0.1)",
        "card":        "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
    },
  },
  plugins: [],
};
export default config;
