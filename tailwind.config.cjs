const defaultTheme = require("tailwindcss/defaultTheme");

const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
      },
      keyframes: {
        goldPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(250, 204, 21, 0.6)',
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
};

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}