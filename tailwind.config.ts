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
        background: "var(--background)",
        foreground: "var(--foreground)",
        hud: {
          dark: "#0b0f19",
          card: "rgba(18, 26, 43, 0.75)",
          border: "rgba(255, 255, 255, 0.12)",
          accent: "#00f2fe",
          green: "#00e676",
          amber: "#ffb300",
          red: "#ff1744",
          neon: "#39ff14",
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 18px rgba(0, 242, 254, 0.95))' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
