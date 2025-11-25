/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary game colors
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Card type colors
        attack: '#8b0000',
        skill: '#006400',
        power: '#00008b',
        curse: '#4a0080',
        // Rarity colors
        common: '#9ca3af',
        uncommon: '#3b82f6',
        rare: '#eab308',
        legendary: '#f97316',
        // UI colors
        panel: {
          DEFAULT: '#1a1a2e',
          light: '#252542',
          dark: '#0f0f1a',
        },
      },
      fontFamily: {
        game: ['Cinzel', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-attack': 'linear-gradient(135deg, #8b0000 0%, #4a0000 100%)',
        'card-skill': 'linear-gradient(135deg, #006400 0%, #003200 100%)',
        'card-power': 'linear-gradient(135deg, #00008b 0%, #000045 100%)',
      },
    },
  },
  plugins: [],
}
