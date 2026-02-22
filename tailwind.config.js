/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#6C757D',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        border: '#E9ECEF',
        error: '#DC3545',
        success: '#28A745',
      },
    },
  },
  plugins: [],
}
