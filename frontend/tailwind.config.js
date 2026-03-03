/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#0A0A0A',
        'black-soft': '#111111',
        surface: '#181818',
        'surface-hover': '#222222',
        'surface-active': '#2A2A2A',
        border: '#2A2A2A',
        'border-hover': '#3A3A3A',
        'text-primary': '#F0F0F0',
        'text-secondary': '#999999',
        'text-muted': '#666666',
        white: '#F0F0F0',
        accent: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
