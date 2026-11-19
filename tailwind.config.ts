import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Palette. Save and refresh the preview to see a color change. */
        turmeric: "#E5A93B",
        botanical: {
          DEFAULT: "#1B4D3E",
          deep: "#12352B",
        },
        paper: "#FAF8F5",
        charcoal: "#1A1A1A",
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
