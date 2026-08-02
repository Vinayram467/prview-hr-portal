/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        ink: {
          50: "#F6F7F8",
          100: "#EBEDEF",
          200: "#D3D7DC",
          300: "#AEB5BF",
          400: "#828C99",
          500: "#646F7D",
          600: "#4F5966",
          700: "#414954",
          800: "#383E47",
          900: "#23272E",
          950: "#16191E",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 22, 0.06), 0 1px 3px rgba(15, 23, 22, 0.08)",
      },
    },
  },
  plugins: [],
};
