/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#FF6B6B',
          light: '#FF8A8A',
          dark: '#FF5252'
        },
        secondary: {
          DEFAULT: '#4ECDC4',
          light: '#66E0D5',
          dark: '#36B3AA'
        },

        // Semantic colors for light mode
        background: '#FFFFFF',
        foreground: '#09090B',
        card: '#FFFFFF',
        'card-foreground': '#09090B',
        muted: '#F4F4F5',
        'muted-foreground': '#71717A',
        border: '#E4E4E7',

        // Semantic colors for dark mode
        'background-dark': '#09090B',
        'foreground-dark': '#FAFAFA',
        'card-dark': '#18181B',
        'card-foreground-dark': '#FAFAFA',
        'muted-dark': '#27272A',
        'muted-foreground-dark': '#A1A1AA',
        'border-dark': '#27272A',
      }
    }
  },
  plugins: []
}