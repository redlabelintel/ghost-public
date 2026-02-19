/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        'terminal-green': '#00ff00',
        'terminal-red': '#ff0000',
        'terminal-bg': '#000000',
      }
    },
  },
  plugins: [],
}