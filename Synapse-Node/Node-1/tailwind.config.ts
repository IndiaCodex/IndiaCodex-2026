import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-lg": "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutal-xl": "8px 8px 0px 0px rgba(0,0,0,1)",
        "brutal-yellow": "4px 4px 0px 0px rgba(250,204,21,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
