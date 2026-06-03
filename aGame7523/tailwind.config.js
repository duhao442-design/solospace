/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',
        secondary: '#FFD700',
        'table-green': '#1E5631',
        'table-dark': '#0F3D1F',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
