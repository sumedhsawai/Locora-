import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF8FE",
          100: "#DCF0FD",
          200: "#B9E2FB",
          300: "#8ACFF9",
          400: "#4EB6F3",
          500: "#0390E0",
          600: "#0163DD",
          700: "#0151B8",
          800: "#014093",
          900: "#03306E",
          950: "#021D47",
        },
        accent: {
          50: "#EFFCF8",
          100: "#D7F8EE",
          200: "#AEF1DE",
          300: "#6FE6C9",
          400: "#13CA9E",
          500: "#0BB38B",
          600: "#089271",
          700: "#0A735C",
          800: "#0B5B4A",
          900: "#0A4B3E",
          950: "#042C24",
        },
        ink: {
          50: "#F5F8FC",
          100: "#E7EDF6",
          200: "#C8D5E7",
          300: "#9FB3CD",
          400: "#7189AC",
          500: "#526D94",
          600: "#3E577E",
          700: "#2C4368",
          800: "#1B3054",
          900: "#0B1F3C",
          950: "#03132B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,31,60,.05), 0 10px 28px -14px rgba(11,31,60,.14)",
        lift: "0 2px 4px rgba(11,31,60,.06), 0 20px 44px -18px rgba(11,31,60,.26)",
        glow: "0 0 0 1px rgba(1,99,221,.2), 0 12px 44px -12px rgba(1,99,221,.55)",
        card: "0 0 0 1px rgba(11,31,60,.06), 0 1px 2px rgba(11,31,60,.04)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(.92)", opacity: "0" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-9px)" },
        },
        "dot-bounce": {
          "0%,80%,100%": { transform: "translateY(0)", opacity: ".35" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: ".5" },
          "50%": { opacity: "1" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.21,.65,.36,1) both",
        "fade-in": "fade-in .4s ease both",
        pop: "pop .32s cubic-bezier(.2,.9,.3,1.35) both",
        shimmer: "shimmer 1.5s linear infinite",
        float: "float 7s ease-in-out infinite",
        "dot-bounce": "dot-bounce 1.2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "heart-pop": "heart-pop .35s ease",
        "slide-up": "slide-up .3s cubic-bezier(.21,.65,.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
