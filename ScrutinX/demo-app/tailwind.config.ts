import type { Config } from "tailwindcss";

// Theme tokens — extend here to reskin/whitelabel without touching components (frontend.md §7).
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f1a",
        surface: "#141a2b",
        surface2: "#1c2438",
        border: "#2a3350",
        muted: "#8592b0",
        text: "#e6ebf5",
        accent: "#6ea8fe",
        success: "#34d399", // chosen MIS nodes
        danger: "#f87171", // conflicts / failures
        warn: "#fbbf24",
      },
    },
  },
  plugins: [],
};

export default config;
