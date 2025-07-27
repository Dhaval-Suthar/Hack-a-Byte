import type { Config } from "tailwindcss";

/** @type {import('tailwindcss').Config} */
module.exports = {
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
        cyber: {
          primary: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          danger: "var(--danger)",
        },
      },
      boxShadow: {
        'cyber': 'var(--cyber-glow)',
        'cyber-intense': 'var(--cyber-glow-intense)',
      },
      fontFamily: {
        terminal: "var(--terminal-font)",
      },
      animation: {
        'scanline': 'scanline 6s linear infinite',
        'flicker': 'flicker 0.3s infinite',
        'gradient': 'gradient-shift 3s ease infinite',
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
