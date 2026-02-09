/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bungee: ['Bungee', 'cursive'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        cream: '#FEF4E0',
        rousseau: {
          blue: '#1e3a5f',
          green: '#22c55e',
          amber: '#d97706',
          gold: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
