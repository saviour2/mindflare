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
        // Cherry blossom retro pixel-art palette
        retro: {
          bg: "transparent",
          panel: "#536175",
          card: "#47566A",
          border: "#3A4657",
          // Pink accent replaces old cyan
          cyan: "#F2AEC0",
          "cyan-dark": "#D68FA3",
          pink: "#F2AEC0",
          "pink-dark": "#D68FA3",
          sky: "#C4A8D8",
          white: "#EAEAEA",
          muted: "#B0B8C6",
          dim: "#8A95A5",
          ink: "#2F3947",
        },
        // Legacy compat — map to new accent
        blue: {
          light: "#F2AEC0",
          base: "#F2AEC0",
          dark: "#D68FA3",
        },
        accent: {
          cyan: "#F2AEC0",
        },
      },
      fontFamily: {
        pixel: ["'VT323'", "monospace"],
        "pixel-sm": ["'Press Start 2P'", "monospace"],
        serif: ["'VT323'", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "var(--font-geist-mono)", "monospace"],
        code: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
      boxShadow: {
        "pixel": "4px 4px 0px #2F3947",
        "pixel-cyan": "4px 4px 0px #D68FA3",
        "pixel-pink": "4px 4px 0px #D68FA3",
        "pixel-sm": "2px 2px 0px #2F3947",
        "pixel-lg": "6px 6px 0px #2F3947",
        "pixel-inset": "inset 2px 2px 0px #2F3947",
        "pixel-press": "2px 2px 0px #2F3947",
      },
      borderWidth: {
        "retro": "3px",
        "3": "3px",
      },
      animation: {
        blob: "blob 18s steps(8) infinite",
        "pixel-blink": "pixel-blink 1s steps(1) infinite",
        "pixel-pulse": "pixel-pulse 2s steps(4) infinite",
        conveyor: "conveyor-move 8s steps(32) infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(20px, -30px) scale(1.05)" },
          "66%": { transform: "translate(-15px, 15px) scale(0.95)" },
        },
        "pixel-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "pixel-pulse": {
          "0%": { boxShadow: "4px 4px 0 #D68FA3" },
          "50%": { boxShadow: "6px 6px 0 #D68FA3" },
          "100%": { boxShadow: "4px 4px 0 #D68FA3" },
        },
        "conveyor-move": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backgroundImage: {
        "pixel-grid":
          "linear-gradient(rgba(242,174,192,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(242,174,192,0.04) 1px, transparent 1px)",
        "organic-grid":
          "linear-gradient(rgba(242,174,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(242,174,192,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "pixel-grid": "32px 32px",
      },
    },
  },
  plugins: [],
};
export default config;
