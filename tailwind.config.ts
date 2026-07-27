import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0C0E12",
          soft: "#14171D",
          line: "#22262F"
        },
        paper: "#F2F1EC",
        signal: {
          DEFAULT: "#FF5A36",
          dim: "#B5401F"
        },
        wave: {
          DEFAULT: "#35D0BA",
          dim: "#1F7A6C"
        },
        muted: "#7C8494"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      keyframes: {
        pulseMarker: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.4)" }
        },
        scrub: {
          "0%": { left: "6%" },
          "50%": { left: "78%" },
          "100%": { left: "6%" }
        }
      },
      animation: {
        marker: "pulseMarker 2.2s ease-in-out infinite",
        scrub: "scrub 9s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
