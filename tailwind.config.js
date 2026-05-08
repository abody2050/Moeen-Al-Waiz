/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        serif: ['Amiri', 'serif'],
        cairo: ['Cairo', 'sans-serif'],
        lateef: ['Lateef', 'serif'],
        vazir: ['Vazirmatn', 'sans-serif'],
        scheherazade: ['Scheherazade New', 'serif'],
      },
    },
  },
  plugins: [],
}
