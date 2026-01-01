import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      spacing: {
        'vw-xs': 'var(--spacing-xs)',
        'vw-sm': 'var(--spacing-sm)',
        'vw-md': 'var(--spacing-md)',
        'vw-lg': 'var(--spacing-lg)',
        'vw-xl': 'var(--spacing-xl)',
      },
      fontSize: {
        'vw-xs': 'var(--size-sm)',
        'vw-sm': 'var(--size-md)',
        'vw-base': 'var(--size-lg)',
        'vw-lg': 'var(--size-xl)',
        'vw-xl': 'var(--size-2xl)',
        'vw-2xl': 'var(--size-3xl)',
        'vw-3xl': 'var(--size-4xl)',
        'vw-4xl': 'var(--size-5xl)',
        'vw-5xl': 'var(--size-6xl)',
        'vw-8xl': 'var(--size-8xl)',
      },
    },
  },
  plugins: [],
};
export default config;
