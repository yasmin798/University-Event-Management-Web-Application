/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2f4156',
        secondary: '#567c8d',
        accent: '#c8d9e6',
        background: '#f5efeb',
      }
    },
  },
  plugins: [],
}