/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B6B',
          light: '#FF8A8A',
          dark: '#FF5252'
        },
        secondary: {
          DEFAULT: '#4ECDC4',
          light: '#66E0D5',
          dark: '#36B3AA'
        }
      }
    }
  },
  plugins: []
}