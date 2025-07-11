/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1e1e1e',
        primary: '#00ffff', // Vibrant cyan/aqua
        secondary: '#4a5568',
        text: '#e0e0e0',
        textSecondary: '#a0aec0',
        border: '#333',
        accentGreen: '#00ff88',
        accentRed: '#ff4d4d',
      },
    },
  },
  plugins: [],
} 