import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Wet Party Hostel-inspired palette: tropical neon, pool-water teals, sunset corals
        wet: {
          50: "#e0fbff",
          100: "#b3f0fa",
          200: "#7fe1f0",
          300: "#3cc9e0",
          400: "#11afc7",
          500: "#0892a6",
          600: "#077589",
          700: "#06596a",
          800: "#053f4d",
          900: "#02232c",
        },
        coral: {
          400: "#ff6b8a",
          500: "#ff4569",
          600: "#e62e51",
        },
        sunset: {
          400: "#ffb347",
          500: "#ff8c42",
          600: "#ff6f1f",
        },
        neon: {
          pink: "#ff3edf",
          aqua: "#00f5ff",
          lime: "#aaff00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui"],
        body: ["var(--font-body)", "system-ui"],
      },
      animation: {
        ripple: "ripple 4s ease-out infinite",
        drip: "drip 6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        wave: "wave 12s linear infinite",
      },
      keyframes: {
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        drip: {
          "0%, 100%": { transform: "translateY(0) scaleY(1)", opacity: "0.8" },
          "50%": { transform: "translateY(20px) scaleY(1.3)", opacity: "0.4" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
