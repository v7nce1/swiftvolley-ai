import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
          vt: {
            // Updated palette: primary blue, warm orange accent, light blue highlights
            mint:     "#1E3A8A",
            amber:    "#FFD166",
            coral:    "#FF8A00",
            blue:     "#4CC9F0",
          bg:       "#0D0D1A",
          surface:  "#13131F",
          elevated: "#1A1A2E",
          outline:  "#2A2A3E",
          muted:    "rgba(255,255,255,0.5)",
          faint:    "rgba(255,255,255,0.2)",
        },
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "spin-slow":"spin 2s linear infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" },                                    to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" },     to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
