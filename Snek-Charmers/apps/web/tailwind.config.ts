import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0B0710",
        surface: "#150F20",
        surface2: "#1F1730",
        line: "#2E2440",
        ink: "#F6F1FF",
        muted: "#A99DC4",
        lime: "#C4FF3D",
        magenta: "#FF3D8A",
        violet: "#9A6BFF",
        gold: "#FFC53D",
      },
      fontFamily: {
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        pop: "0 18px 50px -18px rgba(196,255,61,0.45), 0 0 0 1px rgba(154,107,255,0.35)",
        glow: "0 0 24px -4px rgba(196,255,61,0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
