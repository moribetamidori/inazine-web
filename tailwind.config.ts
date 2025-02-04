import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      rotate: {
        'y-90': 'rotateY(90deg)',
        'y-0': 'rotateY(0deg)',
      },
      transitionDuration: {
        '600': '600ms',
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [],
} satisfies Config;
