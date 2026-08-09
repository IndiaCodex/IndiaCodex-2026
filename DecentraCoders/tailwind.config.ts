import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(8, 9, 20)',
        surface: 'rgb(13, 15, 34)',
        'surface-card': 'rgba(18, 20, 48, 0.55)',
        primary: {
          DEFAULT: '#8b5cf6', // Electric Purple
          hover: '#7c3aed',
        },
        secondary: {
          DEFAULT: '#06b6d4', // Cyan
          hover: '#0891b2',
        },
        success: {
          DEFAULT: '#10b981', // Emerald
          hover: '#059669',
        },
        accent: '#f43f5e', // Coral/Rose
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
      },
      borderColor: {
        translucent: 'rgba(255, 255, 255, 0.08)',
        'purple-glow': 'rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
