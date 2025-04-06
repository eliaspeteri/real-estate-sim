import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "slide-up": "slideUp 0.3s ease-out forwards",
        "slide-right": "slideRight 0.3s ease-out forwards"
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        },
        slideRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        }
      },
      backdropBlur: {
        sm: "4px"
      }
    }
  },
  plugins: []
};

export default config;
