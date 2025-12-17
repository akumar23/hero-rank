/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Neo-Brutalist Color Palette (Dark Theme)
      colors: {
        ink: "#E8E8E8",
        paper: "#0D0D0D",
        signal: "#E63946",
        navy: "#1D3557",
        charcoal: "#E0E0E0",
        smoke: "#888888",
        concrete: "#1A1A1A",
        champion: "#F4A200",
        silver: "#8B8B8B",
        bronze: "#A0522D",
      },
      // Typography
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Tighter spacing scale
      spacing: {
        '0.5': '4px',
        '1': '8px',
        '1.5': '12px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
      },
      // Hard shadows (no blur) - light shadows for dark theme
      boxShadow: {
        'brutal': '4px 4px 0 #E8E8E8',
        'brutal-sm': '2px 2px 0 #E8E8E8',
        'brutal-lg': '6px 6px 0 #E8E8E8',
        'brutal-signal': '4px 4px 0 #E63946',
        'brutal-navy': '4px 4px 0 #1D3557',
        'brutal-inset': 'inset 2px 2px 0 #E8E8E8',
      },
      // Animation
      animation: {
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'press': 'press 0.1s ease-out forwards',
      },
      keyframes: {
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-3deg)' },
        },
        press: {
          '0%': { transform: 'translateY(0)', boxShadow: '4px 4px 0 #E8E8E8' },
          '100%': { transform: 'translateY(2px) translateX(2px)', boxShadow: '2px 2px 0 #E8E8E8' },
        },
      },
      // Border width
      borderWidth: {
        '2': '2px',
        '3': '3px',
      },
    },
  },
  plugins: [],
};
