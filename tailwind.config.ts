import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        uc: {
          DEFAULT: "#2C5A9D", // buttons, links, active highlights (portal's mid blue)
          dark: "#21437D", // sidebar, welcome strip, button hover (portal's deep blue)
          bg: "#F5F7FB", // page background (same as the portal)
          text: "#1F2937",
          muted: "#64748B",
          line: "#E2E8F0",
          gold: "#F0B429", // UCme's own accent: active marker, primary action
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
