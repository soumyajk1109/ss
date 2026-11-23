import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Palette. Save and refresh the preview to see a color change. */
        turmeric: "#E5A93B",
        saffron: "#F0B429",
        rcs: {
          red: "#E10600",
          gold: "#F0B429",
        },
        maroon: {
          DEFAULT: "#7A1024",
          deep: "#4C0A16",
        },
        sale: "#D0122D",
        botanical: {
          DEFAULT: "#1B4D3E",
          deep: "#12352B",
        },
        paper: "#F6F4EF",
        charcoal: "#2A2E38",
        sand: "#E6E0D4",
        clay: "#5E5346",
        line: "#E4DDD2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
