/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ceo-red': '#dc2626',
        'ceo-orange': '#ea580c',
        'ceo-yellow': '#d97706',
        'ceo-green': '#059669',
        'ceo-blue': '#2563eb',
        'ceo-purple': '#7c3aed',
        'ceo-gray': '#374151'
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
          },
          '50%': { 
            opacity: '0.8',
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)'
          },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        }
      }
    },
  },
  plugins: [],
}