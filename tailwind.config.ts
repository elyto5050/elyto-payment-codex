import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./emails/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        card: "#111111",
        border: "#1F1F1F",
        primary: "#7C3AED",
        secondary: "#06B6D4"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        xs: "12px",
        sm: "13px",
        base: "14px",
        lg: "15px",
        xl: "16px"
      },
      spacing: {
        "dense": "6px",
        "dense-lg": "12px"
      },
      borderRadius: {
        dense: "6px",
        "dense-lg": "8px"
      }
    }
  },
  plugins: []
};

export default config;
